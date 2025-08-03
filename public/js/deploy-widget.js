/**
 * EchoTune AI One-Click Deployment Widget
 * A lightweight, embeddable deployment interface
 */

class EchoTuneDeployWidget {
    constructor(options = {}) {
        this.options = {
            container: options.container || 'echotune-deploy-widget',
            theme: options.theme || 'dark',
            showAdvanced: options.showAdvanced || false,
            ...options
        };
        
        this.deploymentMethods = [
            {
                id: 'digitalocean',
                name: 'DigitalOcean',
                icon: '☁️',
                description: 'Managed platform with auto-scaling',
                time: '< 3 min',
                url: 'https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main&refcode=echotuneai',
                type: 'external',
                popular: true
            },
            {
                id: 'docker',
                name: 'Docker',
                icon: '🐳',
                description: 'Run anywhere with containers',
                time: '< 5 min',
                type: 'guide',
                popular: true
            },
            {
                id: 'cli',
                name: 'CLI Tools',
                icon: '⚙️',
                description: 'Advanced deployment options',
                time: '< 10 min',
                type: 'guide'
            }
        ];
        
        this.init();
    }
    
    init() {
        this.createStyles();
        this.createWidget();
        this.attachEventListeners();
    }
    
    createStyles() {
        if (document.getElementById('echotune-deploy-styles')) return;
        
        const styles = `
            <style id="echotune-deploy-styles">
                .echotune-deploy-widget {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 25px;
                    background: linear-gradient(135deg, #121212 0%, #191414 100%);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                }
                
                .echotune-deploy-title {
                    text-align: center;
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 10px;
                    background: linear-gradient(135deg, #1db954, #1ed760);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .echotune-deploy-subtitle {
                    text-align: center;
                    color: #b3b3b3;
                    margin-bottom: 25px;
                    font-size: 0.95rem;
                }
                
                .echotune-deploy-options {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
                
                .echotune-deploy-option {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                
                .echotune-deploy-option:hover {
                    transform: translateY(-2px);
                    border-color: #1db954;
                    box-shadow: 0 8px 25px rgba(29, 185, 84, 0.2);
                }
                
                .echotune-deploy-option.popular::before {
                    content: 'Popular';
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: #1db954;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }
                
                .echotune-deploy-icon {
                    font-size: 2.5rem;
                    margin-bottom: 10px;
                    display: block;
                }
                
                .echotune-deploy-name {
                    font-weight: 600;
                    margin-bottom: 5px;
                    color: white;
                }
                
                .echotune-deploy-description {
                    font-size: 0.85rem;
                    color: #b3b3b3;
                    margin-bottom: 8px;
                }
                
                .echotune-deploy-time {
                    font-size: 0.8rem;
                    color: #1db954;
                    font-weight: 500;
                }
                
                .echotune-deploy-footer {
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .echotune-deploy-link {
                    color: #1db954;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 0.9rem;
                }
                
                .echotune-deploy-link:hover {
                    text-decoration: underline;
                }
                
                .echotune-deploy-status {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(18, 18, 18, 0.95);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 15px;
                    min-width: 280px;
                    backdrop-filter: blur(10px);
                    display: none;
                    z-index: 10000;
                    color: white;
                }
                
                .echotune-deploy-status.show {
                    display: block;
                    animation: echotune-slide-in 0.3s ease;
                }
                
                @keyframes echotune-slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                .echotune-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(29, 185, 84, 0.1);
                    border-left: 2px solid #1db954;
                    border-radius: 50%;
                    animation: echotune-spin 1s linear infinite;
                    display: inline-block;
                    margin-right: 10px;
                }
                
                @keyframes echotune-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @media (max-width: 640px) {
                    .echotune-deploy-widget {
                        margin: 10px;
                        padding: 20px;
                    }
                    
                    .echotune-deploy-options {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    createWidget() {
        const container = document.getElementById(this.options.container);
        if (!container) {
            console.error(`EchoTune Deploy Widget: Container "${this.options.container}" not found`);
            return;
        }
        
        const popularMethods = this.deploymentMethods.filter(m => m.popular);
        const allMethods = this.options.showAdvanced ? this.deploymentMethods : popularMethods;
        
        const widget = `
            <div class="echotune-deploy-widget">
                <div class="echotune-deploy-title">🚀 Deploy EchoTune AI</div>
                <div class="echotune-deploy-subtitle">
                    Get your own music AI assistant running in minutes
                </div>
                
                <div class="echotune-deploy-options">
                    ${allMethods.map(method => `
                        <div class="echotune-deploy-option ${method.popular ? 'popular' : ''}" 
                             data-method="${method.id}" data-type="${method.type}" data-url="${method.url || ''}">
                            <span class="echotune-deploy-icon">${method.icon}</span>
                            <div class="echotune-deploy-name">${method.name}</div>
                            <div class="echotune-deploy-description">${method.description}</div>
                            <div class="echotune-deploy-time">${method.time}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="echotune-deploy-footer">
                    <a href="/deploy/" class="echotune-deploy-link" target="_blank">
                        View all deployment options →
                    </a>
                </div>
            </div>
            
            <div id="echotune-deploy-status" class="echotune-deploy-status">
                <div id="echotune-status-content"></div>
            </div>
        `;
        
        container.innerHTML = widget;
    }
    
    attachEventListeners() {
        const options = document.querySelectorAll('.echotune-deploy-option');
        
        options.forEach(option => {
            option.addEventListener('click', () => {
                const method = option.dataset.method;
                const type = option.dataset.type;
                const url = option.dataset.url;
                
                this.handleDeployment(method, type, url);
            });
        });
    }
    
    handleDeployment(method, type, url) {
        if (type === 'external' && url) {
            this.showStatus('Redirecting to deployment platform...', 'info');
            setTimeout(() => {
                window.open(url, '_blank', 'noopener,noreferrer');
                this.hideStatus();
            }, 1000);
        } else if (type === 'guide') {
            this.showDeploymentGuide(method);
        }
    }
    
    async showDeploymentGuide(method) {
        this.showStatus('Preparing deployment guide...', 'loading');
        
        try {
            // Simulate API call - in real implementation, fetch from /api/deploy/generate
            const response = await this.generateDeploymentCommands(method);
            
            this.showStatus('Deployment guide ready! Check downloads.', 'success');
            
            // Create and download the deployment script
            this.downloadDeploymentScript(method, response.commands);
            
            setTimeout(() => this.hideStatus(), 3000);
        } catch (error) {
            this.showStatus('Failed to generate deployment guide', 'error');
            setTimeout(() => this.hideStatus(), 3000);
        }
    }
    
    async generateDeploymentCommands(method) {
        // In real implementation, this would call the API
        // For now, return mock data
        const commands = this.getMockCommands(method);
        return { commands };
    }
    
    getMockCommands(method) {
        const baseCommands = [
            '# EchoTune AI Deployment Commands',
            '# Clone the repository',
            'git clone https://github.com/dzp5103/Spotify-echo.git',
            'cd Spotify-echo',
            '',
            '# Copy environment template',
            'cp .env.example .env',
            '# Edit .env with your Spotify credentials',
            ''
        ];
        
        switch (method) {
            case 'docker':
                return [
                    ...baseCommands,
                    '# Deploy with Docker',
                    'docker-compose up -d --build',
                    '',
                    '# Check status',
                    'docker-compose ps',
                    '',
                    '# Access at http://localhost:3000'
                ];
            
            case 'cli':
                return [
                    ...baseCommands,
                    '# Choose deployment method:',
                    '',
                    '# DigitalOcean CLI:',
                    'export DO_API_TOKEN="your_token"',
                    './deploy-doctl.sh',
                    '',
                    '# Enhanced CLI:',
                    './deploy-dotcl.sh --interactive'
                ];
            
            default:
                return baseCommands;
        }
    }
    
    downloadDeploymentScript(method, commands) {
        const content = commands.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `echotune-deploy-${method}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('echotune-deploy-status');
        const contentEl = document.getElementById('echotune-status-content');
        
        if (!statusEl || !contentEl) return;
        
        let icon = '';
        switch (type) {
            case 'loading':
                icon = '<span class="echotune-spinner"></span>';
                break;
            case 'success':
                icon = '✅ ';
                break;
            case 'error':
                icon = '❌ ';
                break;
            default:
                icon = 'ℹ️ ';
        }
        
        contentEl.innerHTML = `${icon}${message}`;
        statusEl.classList.add('show');
    }
    
    hideStatus() {
        const statusEl = document.getElementById('echotune-deploy-status');
        if (statusEl) {
            statusEl.classList.remove('show');
        }
    }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('echotune-deploy-widget')) {
        new EchoTuneDeployWidget();
    }
});

// Export for manual initialization
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EchoTuneDeployWidget;
} else if (typeof window !== 'undefined') {
    window.EchoTuneDeployWidget = EchoTuneDeployWidget;
}