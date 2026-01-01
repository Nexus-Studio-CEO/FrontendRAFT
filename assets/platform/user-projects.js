/**
 * FrontendRAFT - User Projects Manager
 * 
 * Manages user API projects with persistence
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

class UserProjects {
    constructor() {
        this.projects = new Map();
        this.currentProject = null;
        this.dbName = 'FrontendRAFT_Projects';
        this.storeName = 'projects';
        this.db = null;
    }

    /**
     * Initialize IndexedDB
     */
    async init() {
        try {
            Logger.info('UserProjects: Initializing database...');
            
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, 1);
                
                request.onerror = () => {
                    Logger.error('UserProjects: Database failed to open');
                    reject(request.error);
                };
                
                request.onsuccess = () => {
                    this.db = request.result;
                    Logger.success('UserProjects: Database opened successfully');
                    this._loadProjects().then(() => {
                        Logger.success('UserProjects: Projects loaded');
                        resolve();
                    }).catch(reject);
                };
                
                request.onupgradeneeded = (event) => {
                    Logger.info('UserProjects: Creating database structure');
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName, { keyPath: 'id' });
                        Logger.info('UserProjects: Object store created');
                    }
                };
            });
            
        } catch (error) {
            Logger.error(`UserProjects: Init failed - ${error.message}`);
            throw error;
        }
    }

    /**
     * Create new project
     * @param {object} data - Project data { name, description }
     * @returns {object} Created project
     */
    async create(data = {}) {
        const project = {
            id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: data.name || 'Untitled API',
            description: data.description || '',
            endpoints: [],
            authStrategy: 'jwt',
            config: {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: 'draft'
        };
        
        await this._saveToDb(project);
        this.projects.set(project.id, project);
        this.currentProject = project;
        
        Logger.success(`UserProjects: Created project "${project.name}"`);
        this._updateUI();
        
        return project;
    }

    /**
     * Update project
     */
    async update(projectId, updates) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        
        Object.assign(project, updates, { updatedAt: Date.now() });
        await this._saveToDb(project);
        
        Logger.info(`UserProjects: Updated project "${project.name}"`);
        this._updateUI();
        
        return project;
    }

    /**
     * Delete project
     */
    async delete(projectId) {
        const project = this.projects.get(projectId);
        if (!project) return;
        
        await this._deleteFromDb(projectId);
        this.projects.delete(projectId);
        
        if (this.currentProject?.id === projectId) {
            this.currentProject = null;
        }
        
        Logger.info(`UserProjects: Deleted project "${project.name}"`);
        this._updateUI();
    }

    /**
     * Get project by ID
     */
    get(projectId) {
        return this.projects.get(projectId);
    }

    /**
     * Get all projects
     */
    getAll() {
        return Array.from(this.projects.values());
    }

    /**
     * Set current project
     */
    setCurrent(projectId) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        
        this.currentProject = project;
        Logger.info(`UserProjects: Switched to "${project.name}"`);
        this._updateUI();
        
        return project;
    }

    /**
     * Add endpoint to current project
     */
    async addEndpoint(endpoint) {
        if (!this.currentProject) {
            throw new Error('No project selected');
        }
        
        const newEndpoint = {
            id: 'ep_' + Date.now(),
            method: endpoint.method || 'GET',
            path: endpoint.path || '/',
            description: endpoint.description || '',
            handler: endpoint.handler || 'async (req) => ({ success: true })',
            ...endpoint
        };
        
        this.currentProject.endpoints.push(newEndpoint);
        await this.update(this.currentProject.id, {
            endpoints: this.currentProject.endpoints
        });
        
        Logger.info(`UserProjects: Added endpoint ${newEndpoint.method} ${newEndpoint.path}`);
        
        return newEndpoint;
    }

    /**
     * Update endpoint
     */
    async updateEndpoint(endpointId, updates) {
        if (!this.currentProject) {
            throw new Error('No project selected');
        }
        
        const endpoint = this.currentProject.endpoints.find(e => e.id === endpointId);
        if (!endpoint) {
            throw new Error('Endpoint not found');
        }
        
        Object.assign(endpoint, updates);
        await this.update(this.currentProject.id, {
            endpoints: this.currentProject.endpoints
        });
        
        Logger.info(`UserProjects: Updated endpoint ${endpoint.method} ${endpoint.path}`);
    }

    /**
     * Delete endpoint
     */
    async deleteEndpoint(endpointId) {
        if (!this.currentProject) return;
        
        const index = this.currentProject.endpoints.findIndex(e => e.id === endpointId);
        if (index === -1) return;
        
        this.currentProject.endpoints.splice(index, 1);
        await this.update(this.currentProject.id, {
            endpoints: this.currentProject.endpoints
        });
        
        Logger.info('UserProjects: Deleted endpoint');
    }

    /**
     * Deploy project
     */
    async deploy(projectId) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        
        // Register with CDN
        const apiId = await CDNClient.register({
            name: project.name,
            endpoints: project.endpoints,
            authStrategy: project.authStrategy,
            p2pAddress: P2PLayer.peerId
        });
        
        // Update project status
        await this.update(projectId, {
            status: 'deployed',
            apiId,
            deployedAt: Date.now()
        });
        
        Logger.success(`UserProjects: Deployed "${project.name}" (ID: ${apiId})`);
        
        return { project, apiId };
    }

    /**
     * Export project as JSON
     */
    exportProject(projectId) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        
        const data = JSON.stringify(project, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        Logger.info(`UserProjects: Exported "${project.name}"`);
    }

    /**
     * Import project from JSON
     */
    async importProject(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const project = JSON.parse(e.target.result);
                    project.id = 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    project.createdAt = Date.now();
                    project.updatedAt = Date.now();
                    project.status = 'draft';
                    
                    await this._saveToDb(project);
                    this.projects.set(project.id, project);
                    
                    Logger.success(`UserProjects: Imported "${project.name}"`);
                    this._updateUI();
                    
                    resolve(project);
                } catch (error) {
                    Logger.error(`UserProjects: Import failed: ${error.message}`);
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    // Private methods

    async _loadProjects() {
        if (!this.db) {
            Logger.warn('UserProjects: Database not initialized, skipping load');
            return;
        }
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.getAll();
                
                request.onsuccess = () => {
                    const projects = request.result || [];
                    projects.forEach(project => {
                        this.projects.set(project.id, project);
                    });
                    
                    Logger.info(`UserProjects: Loaded ${projects.length} project(s)`);
                    
                    // Select first project if none selected
                    if (projects.length > 0 && !this.currentProject) {
                        this.currentProject = projects[0];
                        Logger.info(`UserProjects: Auto-selected "${this.currentProject.name}"`);
                    }
                    
                    this._updateUI();
                    resolve();
                };
                
                request.onerror = () => {
                    Logger.error('UserProjects: Failed to load projects');
                    reject(request.error);
                };
                
            } catch (error) {
                Logger.error(`UserProjects: Load error - ${error.message}`);
                reject(error);
            }
        });
    }

    async _saveToDb(project) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(project);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async _deleteFromDb(projectId) {
        if (!this.db) return;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(projectId);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    _updateUI() {
        const container = document.getElementById('project-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.projects.forEach(project => {
            const div = document.createElement('div');
            div.className = 'group flex items-center justify-between px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-md cursor-pointer';
            
            const isActive = this.currentProject?.id === project.id;
            if (isActive) {
                div.classList.add('bg-slate-800');
            }
            
            const statusColor = project.status === 'deployed' ? 'bg-success' : 'bg-slate-500';
            
            div.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full ${statusColor}"></span>
                    <span class="text-sm truncate">${project.name}</span>
                </div>
                <i class="ph-bold ph-dots-three text-slate-500 opacity-0 group-hover:opacity-100"></i>
            `;
            
            div.onclick = () => {
                this.setCurrent(project.id);
                window.location.reload(); // Reload to reflect changes
            };
            
            container.appendChild(div);
        });
    }
}

// Global instance
window.UserProjects = new UserProjects();