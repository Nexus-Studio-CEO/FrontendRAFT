/**
 * FrontendRAFT - API Builder
 * 
 * Visual API builder with no-code, low-code, and code modes
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

class APIBuilder {
    constructor() {
        this.currentLevel = 1; // 1: no-code, 2: low-code, 3: code
        this.endpoints = [];
    }

    /**
     * Initialize builder
     */
    async init() {
        await UserProjects.init();
        
        // Load current project or create default
        if (UserProjects.currentProject) {
            this.endpoints = UserProjects.currentProject.endpoints || [];
        } else {
            await UserProjects.create({ name: 'My First API' });
            this.endpoints = [];
        }
        
        this.renderEndpoints();
        Logger.info('APIBuilder: Initialized');
    }

    /**
     * Add new endpoint
     */
    async addEndpoint() {
        const endpoint = {
            method: 'GET',
            path: '/endpoint-' + Date.now(),
            description: 'New endpoint',
            handler: `async (req) => {
    return {
        success: true,
        message: 'Endpoint response'
    };
}`
        };
        
        const created = await UserProjects.addEndpoint(endpoint);
        this.endpoints.push(created);
        this.renderEndpoints();
        
        Logger.success('APIBuilder: Endpoint added');
    }

    /**
     * Update endpoint
     */
    async updateEndpoint(endpointId, updates) {
        await UserProjects.updateEndpoint(endpointId, updates);
        
        const endpoint = this.endpoints.find(e => e.id === endpointId);
        if (endpoint) {
            Object.assign(endpoint, updates);
        }
        
        this.renderEndpoints();
        Logger.info('APIBuilder: Endpoint updated');
    }

    /**
     * Delete endpoint
     */
    async deleteEndpoint(endpointId) {
        if (!confirm('Delete this endpoint?')) return;
        
        await UserProjects.deleteEndpoint(endpointId);
        this.endpoints = this.endpoints.filter(e => e.id !== endpointId);
        this.renderEndpoints();
        
        Logger.info('APIBuilder: Endpoint deleted');
    }

    /**
     * Render endpoints list
     */
    renderEndpoints() {
        const container = document.getElementById('endpoint-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.endpoints.length === 0) {
            container.innerHTML = `
                <div class="p-8 text-center text-slate-500">
                    <i class="ph ph-plus-circle text-4xl mb-2"></i>
                    <p>No endpoints yet. Click "Add" to create one.</p>
                </div>
            `;
            return;
        }
        
        this.endpoints.forEach(endpoint => {
            const div = document.createElement('div');
            div.className = 'p-4 hover:bg-slate-800/50 transition flex flex-col sm:flex-row gap-4 items-start sm:items-center group';
            
            const methodColors = {
                GET: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                POST: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                PUT: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                DELETE: 'bg-red-500/10 text-red-500 border-red-500/20',
                PATCH: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
            };
            
            const methodClass = methodColors[endpoint.method] || methodColors.GET;
            
            div.innerHTML = `
                <div class="flex items-center gap-3 flex-1">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${methodClass} border">${endpoint.method}</span>
                    <span class="font-mono text-sm text-slate-300">${endpoint.path}</span>
                    <span class="text-xs text-slate-500 hidden sm:inline-block">${endpoint.description}</span>
                </div>
                <div class="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded" onclick="RAFT.editEndpoint('${endpoint.id}')">
                        <i class="ph-bold ph-pencil-simple"></i>
                    </button>
                    <button class="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded" onclick="RAFT.deleteEndpoint('${endpoint.id}')">
                        <i class="ph-bold ph-trash"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(div);
        });
    }

    /**
     * Edit endpoint (modal or inline)
     */
    editEndpoint(endpointId) {
        const endpoint = this.endpoints.find(e => e.id === endpointId);
        if (!endpoint) return;
        
        // Simple prompt for MVP (can be enhanced with modal)
        const newPath = prompt('Endpoint path:', endpoint.path);
        if (newPath && newPath !== endpoint.path) {
            this.updateEndpoint(endpointId, { path: newPath });
        }
    }

    /**
     * Generate code from visual builder
     */
    generateCode() {
        if (!UserProjects.currentProject) return '';
        
        const project = UserProjects.currentProject;
        
        let code = `// ${project.name}\n`;
        code += `// Generated by FrontendRAFT\n\n`;
        
        code += `// Initialize Router\n`;
        code += `const router = new Router();\n\n`;
        
        if (project.authStrategy !== 'none') {
            code += `// Auth middleware\n`;
            code += `router.use(AuthLayer.createAuthMiddleware({ strategy: '${project.authStrategy}' }));\n\n`;
        }
        
        code += `// Endpoints\n`;
        this.endpoints.forEach(endpoint => {
            code += `router.${endpoint.method.toLowerCase()}('${endpoint.path}', ${endpoint.handler});\n\n`;
        });
        
        code += `// Handle requests\n`;
        code += `async function handleRequest(request) {\n`;
        code += `    return await router.handle(request);\n`;
        code += `}\n`;
        
        const display = document.getElementById('code-display');
        if (display) {
            display.textContent = code;
        }
        
        return code;
    }

    /**
     * Test API locally
     */
    async testAPI() {
        if (this.endpoints.length === 0) {
            alert('Add at least one endpoint first');
            return;
        }
        
        const testEndpoint = this.endpoints[0];
        
        try {
            Logger.info(`APIBuilder: Testing ${testEndpoint.method} ${testEndpoint.path}`);
            
            // Setup router with endpoints
            Router.clear();
            
            this.endpoints.forEach(endpoint => {
                const handler = new Function('req', `return (${endpoint.handler})(req)`);
                Router.register(endpoint.method, endpoint.path, handler);
            });
            
            // Test request
            const response = await Router.handle({
                method: testEndpoint.method,
                path: testEndpoint.path,
                headers: {},
                query: {},
                body: null
            });
            
            Logger.success('APIBuilder: Test successful', response);
            alert('Test successful! Check logs for details.');
            
        } catch (error) {
            Logger.error(`APIBuilder: Test failed: ${error.message}`);
            alert('Test failed! Check logs for details.');
        }
    }

    /**
     * Save project
     */
    async saveProject() {
        if (!UserProjects.currentProject) return;
        
        const name = document.getElementById('api-name')?.value || 'My API';
        const authStrategy = document.getElementById('auth-strategy')?.value || 'jwt';
        
        await UserProjects.update(UserProjects.currentProject.id, {
            name,
            authStrategy,
            endpoints: this.endpoints
        });
        
        const statusEl = document.getElementById('save-status');
        if (statusEl) {
            statusEl.textContent = 'Saved';
            setTimeout(() => {
                statusEl.textContent = 'Ready';
            }, 2000);
        }
        
        Logger.success('APIBuilder: Project saved');
    }

    /**
     * Create new project
     */
    async createNewProject() {
        const name = prompt('Project name:', 'New API');
        if (!name) return;
        
        await UserProjects.create({ name });
        window.location.reload();
    }
}

// Global RAFT instance
window.RAFT = {
    builder: new APIBuilder(),
    
    async init() {
        await this.builder.init();
    },
    
    addEndpoint() {
        return this.builder.addEndpoint();
    },
    
    deleteEndpoint(id) {
        return this.builder.deleteEndpoint(id);
    },
    
    editEndpoint(id) {
        return this.builder.editEndpoint(id);
    },
    
    generateCode() {
        return this.builder.generateCode();
    },
    
    testAPI() {
        return this.builder.testAPI();
    },
    
    saveProject() {
        return this.builder.saveProject();
    },
    
    createNewProject() {
        return this.builder.createNewProject();
    },
    
    async deployAPI() {
        if (!UserProjects.currentProject) {
            alert('No project to deploy');
            return;
        }
        
        try {
            const { apiId } = await UserProjects.deploy(UserProjects.currentProject.id);
            
            document.getElementById('deploy-id').value = apiId;
            
            const resultDiv = document.getElementById('deploy-result');
            const urlDisplay = document.getElementById('api-url');
            
            if (resultDiv && urlDisplay) {
                urlDisplay.textContent = `https://raft-cdn.example.com/${apiId}`;
                resultDiv.classList.remove('hidden');
            }
            
            Logger.success('Deployment successful!');
            
        } catch (error) {
            Logger.error(`Deployment failed: ${error.message}`);
            alert('Deployment failed. Check logs.');
        }
    },
    
    copyURL() {
        const url = document.getElementById('api-url')?.textContent;
        if (url) {
            navigator.clipboard.writeText(url);
            Logger.info('API URL copied to clipboard');
        }
    }
};