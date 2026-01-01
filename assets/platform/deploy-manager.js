/**
 * FrontendRAFT - Deploy Manager
 * 
 * Handles API deployment and CDN registration
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

class DeployManager {
    constructor() {
        this.deployments = new Map();
        this.deploymentHistory = [];
    }

    /**
     * Deploy API to CDN
     * @param {object} project - Project to deploy
     * @returns {Promise<object>} Deployment info
     */
    async deploy(project) {
        if (!project || !project.endpoints || project.endpoints.length === 0) {
            throw new Error('Invalid project or no endpoints defined');
        }
        
        Logger.info(`DeployManager: Starting deployment for "${project.name}"`);
        
        const deployment = {
            id: 'deploy_' + Date.now(),
            projectId: project.id,
            projectName: project.name,
            status: 'in_progress',
            startedAt: Date.now(),
            steps: []
        };
        
        this.deployments.set(deployment.id, deployment);
        
        try {
            // Step 1: Validate endpoints
            await this._step(deployment, 'Validating endpoints', async () => {
                this._validateEndpoints(project.endpoints);
            });
            
            // Step 2: Initialize P2P
            await this._step(deployment, 'Initializing P2P layer', async () => {
                await P2PLayer.init();
            });
            
            // Step 3: Register with CDN
            await this._step(deployment, 'Registering with CDN', async () => {
                const apiId = await CDNClient.register({
                    name: project.name,
                    endpoints: project.endpoints,
                    authStrategy: project.authStrategy,
                    p2pAddress: P2PLayer.peerId
                });
                deployment.apiId = apiId;
            });
            
            // Step 4: Setup routing
            await this._step(deployment, 'Configuring routes', async () => {
                this._setupRoutes(project);
            });
            
            // Step 5: Health check
            await this._step(deployment, 'Running health check', async () => {
                await this._healthCheck(deployment.apiId);
            });
            
            deployment.status = 'success';
            deployment.completedAt = Date.now();
            deployment.duration = deployment.completedAt - deployment.startedAt;
            
            this.deploymentHistory.push({
                id: deployment.id,
                projectName: project.name,
                apiId: deployment.apiId,
                timestamp: deployment.completedAt,
                duration: deployment.duration
            });
            
            Logger.success(`DeployManager: Deployment successful (${deployment.duration}ms)`);
            
            return {
                apiId: deployment.apiId,
                url: CDNClient.getEndpointURL(),
                duration: deployment.duration
            };
            
        } catch (error) {
            deployment.status = 'failed';
            deployment.error = error.message;
            deployment.completedAt = Date.now();
            
            Logger.error(`DeployManager: Deployment failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Execute deployment step
     */
    async _step(deployment, stepName, fn) {
        const step = {
            name: stepName,
            startedAt: Date.now(),
            status: 'in_progress'
        };
        
        deployment.steps.push(step);
        Logger.info(`DeployManager: ${stepName}...`);
        
        try {
            await fn();
            step.status = 'success';
            step.completedAt = Date.now();
            step.duration = step.completedAt - step.startedAt;
        } catch (error) {
            step.status = 'failed';
            step.error = error.message;
            throw error;
        }
    }

    /**
     * Validate endpoints
     */
    _validateEndpoints(endpoints) {
        endpoints.forEach(endpoint => {
            if (!endpoint.method) {
                throw new Error(`Endpoint missing method: ${endpoint.path}`);
            }
            
            if (!endpoint.path) {
                throw new Error('Endpoint missing path');
            }
            
            if (!endpoint.path.startsWith('/')) {
                throw new Error(`Endpoint path must start with /: ${endpoint.path}`);
            }
            
            if (!endpoint.handler) {
                throw new Error(`Endpoint missing handler: ${endpoint.path}`);
            }
        });
        
        Logger.info(`DeployManager: Validated ${endpoints.length} endpoints`);
    }

    /**
     * Setup routes
     */
    _setupRoutes(project) {
        Router.clear();
        
        // Add auth middleware if needed
        if (project.authStrategy !== 'none') {
            Router.use(AuthLayer.createAuthMiddleware({
                strategy: project.authStrategy,
                required: false
            }));
        }
        
        // Add CORS middleware
        Router.use(Router.createCORSMiddleware({
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        }));
        
        // Register endpoints
        project.endpoints.forEach(endpoint => {
            try {
                const handler = new Function('req', `return (${endpoint.handler})(req)`);
                Router.register(endpoint.method, endpoint.path, handler);
            } catch (error) {
                throw new Error(`Invalid handler for ${endpoint.method} ${endpoint.path}: ${error.message}`);
            }
        });
        
        // Add health endpoint
        Router.get('/health', async () => ({
            status: 'healthy',
            timestamp: Date.now(),
            apiId: CDNClient.apiId
        }));
        
        Logger.info(`DeployManager: Configured ${project.endpoints.length} routes`);
    }

    /**
     * Health check
     */
    async _healthCheck(apiId) {
        const response = await Router.handle({
            method: 'GET',
            path: '/health',
            headers: {},
            query: {},
            body: null
        });
        
        if (response.status !== 200) {
            throw new Error('Health check failed');
        }
        
        Logger.info('DeployManager: Health check passed');
    }

    /**
     * Undeploy API
     */
    async undeploy(apiId) {
        await CDNClient.unregister();
        Router.clear();
        
        Logger.info(`DeployManager: Undeployed API ${apiId}`);
    }

    /**
     * Get deployment status
     */
    getDeployment(deploymentId) {
        return this.deployments.get(deploymentId);
    }

    /**
     * Get deployment history
     */
    getHistory(limit = 10) {
        return this.deploymentHistory.slice(-limit).reverse();
    }

    /**
     * Rollback deployment
     */
    async rollback(deploymentId) {
        const deployment = this.deployments.get(deploymentId);
        if (!deployment) {
            throw new Error('Deployment not found');
        }
        
        Logger.info(`DeployManager: Rolling back deployment ${deploymentId}`);
        
        if (deployment.apiId) {
            await this.undeploy(deployment.apiId);
        }
        
        deployment.status = 'rolled_back';
        Logger.success('DeployManager: Rollback complete');
    }

    /**
     * Get deployment statistics
     */
    getStats() {
        const successful = this.deploymentHistory.filter(d => d.duration).length;
        const failed = Array.from(this.deployments.values()).filter(d => d.status === 'failed').length;
        
        const avgDuration = this.deploymentHistory.length > 0
            ? this.deploymentHistory.reduce((sum, d) => sum + (d.duration || 0), 0) / this.deploymentHistory.length
            : 0;
        
        return {
            total: this.deploymentHistory.length,
            successful,
            failed,
            avgDuration: Math.round(avgDuration),
            active: Array.from(this.deployments.values()).filter(d => d.status === 'in_progress').length
        };
    }

    /**
     * Generate deployment report
     */
    generateReport(deploymentId) {
        const deployment = this.deployments.get(deploymentId);
        if (!deployment) {
            throw new Error('Deployment not found');
        }
        
        let report = `=== FrontendRAFT Deployment Report ===\n\n`;
        report += `Project: ${deployment.projectName}\n`;
        report += `Deployment ID: ${deployment.id}\n`;
        report += `API ID: ${deployment.apiId || 'N/A'}\n`;
        report += `Status: ${deployment.status}\n`;
        report += `Started: ${new Date(deployment.startedAt).toISOString()}\n`;
        
        if (deployment.completedAt) {
            report += `Completed: ${new Date(deployment.completedAt).toISOString()}\n`;
            report += `Duration: ${deployment.duration}ms\n`;
        }
        
        report += `\n--- Steps ---\n`;
        deployment.steps.forEach((step, index) => {
            report += `${index + 1}. ${step.name}: ${step.status}`;
            if (step.duration) {
                report += ` (${step.duration}ms)`;
            }
            if (step.error) {
                report += ` - Error: ${step.error}`;
            }
            report += `\n`;
        });
        
        return report;
    }

    /**
     * Export deployment logs
     */
    exportLogs(deploymentId) {
        const report = this.generateReport(deploymentId);
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deployment-${deploymentId}-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        Logger.info('DeployManager: Logs exported');
    }
}

// Global instance
window.DeployManager = new DeployManager();