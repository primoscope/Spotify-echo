#!/bin/bash

# 🧙‍♂️ EchoTune AI - Interactive Deployment Wizard
# Step-by-step guided deployment for beginners

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Configuration
WIZARD_VERSION="1.0.0"

# Header with animation
print_animated_header() {
    clear
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════════════╗"
    echo "║                    🧙‍♂️ EchoTune AI Deployment Wizard                     ║"
    echo "║                      Making deployment magical since 2024                ║"
    echo "║                               Version $WIZARD_VERSION                             ║"
    echo "╚══════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "${CYAN}✨ Welcome! This wizard will guide you through deploying EchoTune AI${NC}"
    echo -e "${CYAN}   No technical expertise required - just follow the prompts!${NC}"
    echo ""
}

# Logging functions with emojis
log_info() { echo -e "${BLUE}ℹ️${NC}  $1"; }
log_success() { echo -e "${GREEN}✅${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠️${NC}  $1"; }
log_error() { echo -e "${RED}❌${NC} $1"; }
log_step() { echo -e "${CYAN}🔄${NC} $1"; }
log_question() { echo -e "${PURPLE}❓${NC} $1"; }

# Wait for user to press enter
wait_for_user() {
    echo ""
    echo -e "${YELLOW}Press Enter to continue...${NC}"
    read -r
}

# Introduction and overview
show_introduction() {
    print_animated_header
    
    echo -e "${WHITE}🎵 What is EchoTune AI?${NC}"
    echo "EchoTune AI is a next-generation music recommendation system that:"
    echo "• 🤖 Uses AI to understand your music taste"
    echo "• 🎼 Integrates with Spotify for personalized recommendations"
    echo "• 💬 Features conversational AI for music discovery"
    echo "• 🔄 Provides automated music curation"
    echo ""
    
    echo -e "${WHITE}🚀 What will this wizard do?${NC}"
    echo "1. 🔍 Check your system for requirements"
    echo "2. 🎯 Choose the best deployment method for you"
    echo "3. ⚙️ Configure your Spotify and AI integrations"
    echo "4. 🚀 Deploy and test your application"
    echo "5. 🎉 Get you up and running in minutes!"
    echo ""
    
    echo -e "${GREEN}Ready to start your musical journey?${NC}"
    wait_for_user
}

# Step 1: System Check
check_system_requirements() {
    clear
    echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                   Step 1: System Requirements                 ║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    log_step "Checking your system requirements..."
    echo ""
    
    # Check operating system
    local os_name=""
    if [[ "$OSTYPE" == "darwin"* ]]; then
        os_name="macOS"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        os_name="Linux"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        os_name="Windows"
    else
        os_name="Unknown"
    fi
    
    log_info "Operating System: $os_name"
    
    # Check for Git
    if command -v git >/dev/null 2>&1; then
        local git_version
        git_version=$(git --version | awk '{print $3}')
        log_success "Git installed: v$git_version"
    else
        log_error "Git not found"
        echo "  💡 Install Git: https://git-scm.com/downloads"
        return 1
    fi
    
    # Check for Node.js
    if command -v node >/dev/null 2>&1; then
        local node_version
        node_version=$(node --version)
        log_success "Node.js installed: $node_version"
        
        # Check version compatibility
        local node_major
        node_major=$(echo "$node_version" | sed 's/v//' | cut -d'.' -f1)
        if [ "$node_major" -lt 18 ]; then
            log_warning "Node.js version is older than recommended (18+)"
            echo "  💡 Consider updating: https://nodejs.org/"
        fi
    else
        log_error "Node.js not found"
        echo "  💡 Install Node.js: https://nodejs.org/"
        return 1
    fi
    
    # Check for npm
    if command -v npm >/dev/null 2>&1; then
        local npm_version
        npm_version=$(npm --version)
        log_success "npm installed: v$npm_version"
    else
        log_error "npm not found (should come with Node.js)"
        return 1
    fi
    
    # Check for Docker (optional)
    if command -v docker >/dev/null 2>&1; then
        local docker_version
        docker_version=$(docker --version | awk '{print $3}' | sed 's/,//')
        log_success "Docker available: v$docker_version"
        echo "  🐳 You can use Docker deployment!"
    else
        log_info "Docker not found (optional)"
        echo "  💡 Install Docker for easy deployment: https://docs.docker.com/get-docker/"
    fi
    
    echo ""
    log_success "System check complete!"
    wait_for_user
    return 0
}

# Step 2: Choose deployment method
choose_deployment_method() {
    clear
    echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                 Step 2: Choose Deployment Method               ║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${WHITE}🎯 Which deployment method would you prefer?${NC}"
    echo ""
    
    echo -e "${GREEN}1. 💻 Local Development${NC}"
    echo "   • Perfect for testing and development"
    echo "   • Runs on your computer (localhost:3000)"
    echo "   • Easy to start and stop"
    echo ""
    
    echo -e "${BLUE}2. 🐳 Docker Container${NC}"
    echo "   • Isolated and portable"
    echo "   • Works on any system with Docker"
    echo "   • Professional deployment"
    echo ""
    
    echo -e "${CYAN}3. ☁️ Cloud Deployment${NC}"
    echo "   • Production-ready hosting"
    echo "   • Accessible from anywhere"
    echo "   • Professional grade"
    echo ""
    
    echo -e "${YELLOW}4. 🤖 Auto-Detect Best Option${NC}"
    echo "   • Let the wizard choose for you"
    echo "   • Based on your system capabilities"
    echo ""
    
    while true; do
        echo ""
        log_question "Enter your choice (1-4): "
        read -r choice
        
        case $choice in
            1)
                echo "local"
                return 0
                ;;
            2)
                if command -v docker >/dev/null 2>&1; then
                    echo "docker"
                    return 0
                else
                    log_error "Docker is not installed on your system"
                    echo "  Would you like to choose a different option? (y/N): "
                    read -r retry
                    if [[ ! "$retry" =~ ^[Yy]$ ]]; then
                        echo "local"  # Fallback to local
                        return 0
                    fi
                fi
                ;;
            3)
                echo "cloud"
                return 0
                ;;
            4)
                # Auto-detect
                if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
                    echo "docker"
                else
                    echo "local"
                fi
                return 0
                ;;
            *)
                log_error "Invalid choice. Please enter 1, 2, 3, or 4."
                ;;
        esac
    done
}

# Step 3: Configuration wizard
setup_configuration() {
    local deployment_method="$1"
    
    clear
    echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                     Step 3: Configuration                     ║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    log_step "Setting up your EchoTune AI configuration..."
    echo ""
    
    # Create .env file
    local env_file=".env"
    if [ -f "$env_file" ]; then
        log_info "Found existing configuration"
        echo ""
        log_question "Would you like to keep your existing settings? (Y/n): "
        read -r keep_config
        if [[ "$keep_config" =~ ^[Nn]$ ]]; then
            rm "$env_file"
        else
            log_success "Keeping existing configuration"
            return 0
        fi
    fi
    
    # Copy from template
    if [ -f ".env.example" ]; then
        cp .env.example "$env_file"
        log_success "Created configuration from template"
    else
        # Create basic configuration
        cat > "$env_file" << 'EOF'
# EchoTune AI Configuration
NODE_ENV=production
PORT=3000

# Spotify Integration (Get from: https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback

# AI Providers (Optional but enhances recommendations)
OPENAI_API_KEY=
GEMINI_API_KEY=
LLM_PROVIDER=openai

# Database Configuration (Optional for advanced features)
MONGODB_URI=
SUPABASE_URL=
SUPABASE_ANON_KEY=

# MCP Server Configuration
MCP_SERVER_PORT=3001
EOF
        log_success "Created basic configuration file"
    fi
    
    echo ""
    echo -e "${WHITE}🎵 Spotify Integration Setup${NC}"
    echo "To get the full EchoTune AI experience, you'll need Spotify credentials:"
    echo ""
    echo -e "${YELLOW}1. Visit: https://developer.spotify.com/dashboard${NC}"
    echo -e "${YELLOW}2. Click 'Create App'${NC}"
    echo -e "${YELLOW}3. Use these settings:${NC}"
    echo "   • App Name: EchoTune AI"
    echo "   • Redirect URI: http://localhost:3000/callback"
    echo "   • API Used: Web API"
    echo ""
    
    log_question "Do you want to configure Spotify now? (Y/n): "
    read -r setup_spotify
    
    if [[ ! "$setup_spotify" =~ ^[Nn]$ ]]; then
        echo ""
        log_question "Enter your Spotify Client ID (or press Enter to skip): "
        read -r spotify_client_id
        
        if [ -n "$spotify_client_id" ]; then
            log_question "Enter your Spotify Client Secret: "
            read -r -s spotify_client_secret
            echo ""
            
            # Update .env file
            sed -i.bak "s/SPOTIFY_CLIENT_ID=.*/SPOTIFY_CLIENT_ID=$spotify_client_id/" "$env_file"
            sed -i.bak "s/SPOTIFY_CLIENT_SECRET=.*/SPOTIFY_CLIENT_SECRET=$spotify_client_secret/" "$env_file"
            
            log_success "Spotify credentials saved!"
        else
            log_info "Skipped Spotify setup (you can configure this later)"
        fi
    else
        log_info "Skipped Spotify setup (demo mode will be available)"
    fi
    
    echo ""
    echo -e "${WHITE}🤖 AI Enhancement (Optional)${NC}"
    echo "EchoTune AI can use OpenAI or Google Gemini for enhanced recommendations:"
    echo ""
    
    log_question "Would you like to add AI provider credentials? (y/N): "
    read -r setup_ai
    
    if [[ "$setup_ai" =~ ^[Yy]$ ]]; then
        echo ""
        echo "Choose your AI provider:"
        echo "1. OpenAI (ChatGPT)"
        echo "2. Google Gemini"
        echo ""
        
        log_question "Enter choice (1 or 2): "
        read -r ai_choice
        
        case $ai_choice in
            1)
                log_question "Enter your OpenAI API key: "
                read -r -s openai_key
                echo ""
                sed -i.bak "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$openai_key/" "$env_file"
                sed -i.bak "s/LLM_PROVIDER=.*/LLM_PROVIDER=openai/" "$env_file"
                log_success "OpenAI configuration saved!"
                ;;
            2)
                log_question "Enter your Google Gemini API key: "
                read -r -s gemini_key
                echo ""
                sed -i.bak "s/GEMINI_API_KEY=.*/GEMINI_API_KEY=$gemini_key/" "$env_file"
                sed -i.bak "s/LLM_PROVIDER=.*/LLM_PROVIDER=gemini/" "$env_file"
                log_success "Gemini configuration saved!"
                ;;
            *)
                log_info "Skipped AI provider setup"
                ;;
        esac
    else
        log_info "Skipped AI provider setup (basic recommendations will be available)"
    fi
    
    echo ""
    log_success "Configuration complete!"
    wait_for_user
}

# Step 4: Deploy application
deploy_application() {
    local method="$1"
    
    clear
    echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                      Step 4: Deployment                       ║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    log_step "Deploying EchoTune AI using $method method..."
    echo ""
    
    case "$method" in
        "local")
            log_info "Installing dependencies..."
            if npm install --silent; then
                log_success "Dependencies installed successfully"
            else
                log_error "Failed to install dependencies"
                return 1
            fi
            
            echo ""
            log_success "🚀 EchoTune AI is ready to start!"
            echo ""
            echo -e "${GREEN}Starting the application...${NC}"
            echo -e "${CYAN}➜ Local:   http://localhost:3000${NC}"
            echo -e "${CYAN}➜ Network: http://$(hostname -I | awk '{print $1}'):3000${NC}"
            echo ""
            echo -e "${YELLOW}Press Ctrl+C to stop the application${NC}"
            echo ""
            
            # Start the application
            npm start
            ;;
            
        "docker")
            log_info "Building Docker container..."
            if [ -f "docker-compose.yml" ]; then
                if docker-compose up -d; then
                    log_success "Docker container started successfully"
                    echo ""
                    echo -e "${GREEN}🐳 EchoTune AI is running in Docker!${NC}"
                    echo -e "${CYAN}➜ Access: http://localhost:3000${NC}"
                    echo ""
                    echo -e "${YELLOW}Useful Docker commands:${NC}"
                    echo "  docker-compose logs -f     # View logs"
                    echo "  docker-compose stop        # Stop containers"
                    echo "  docker-compose restart     # Restart containers"
                    echo ""
                else
                    log_error "Failed to start Docker containers"
                    return 1
                fi
            else
                log_error "Docker Compose configuration not found"
                return 1
            fi
            ;;
            
        "cloud")
            echo -e "${CYAN}☁️ Cloud Deployment Options:${NC}"
            echo ""
            echo "1. 🌊 DigitalOcean App Platform (Recommended)"
            echo "   Click: https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo"
            echo ""
            echo "2. 🚀 Vercel (Frontend focused)"
            echo "   Run: npx vercel"
            echo ""
            echo "3. 🔷 Heroku (Traditional PaaS)"
            echo "   Run: git push heroku main"
            echo ""
            echo "4. 🏗️ Custom Server"
            echo "   Use the production deployment script"
            echo ""
            
            log_question "Which cloud option would you like instructions for? (1-4): "
            read -r cloud_choice
            
            case $cloud_choice in
                1)
                    echo ""
                    log_info "Opening DigitalOcean deployment page..."
                    echo ""
                    echo -e "${GREEN}🌊 DigitalOcean One-Click Deploy:${NC}"
                    echo "1. Click this link: https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo"
                    echo "2. Sign in to your DigitalOcean account"
                    echo "3. Review the app configuration"
                    echo "4. Add your environment variables (Spotify credentials, etc.)"
                    echo "5. Click 'Create Resources'"
                    echo "6. Wait for deployment to complete"
                    echo ""
                    log_success "Your app will be available at: your-app-name.ondigitalocean.app"
                    ;;
                *)
                    log_info "For other cloud options, please refer to the documentation"
                    ;;
            esac
            ;;
            
        *)
            log_error "Unknown deployment method: $method"
            return 1
            ;;
    esac
    
    return 0
}

# Step 5: Verification and next steps
show_completion() {
    local method="$1"
    
    if [ "$method" = "cloud" ]; then
        return 0  # Cloud deployment has its own completion message
    fi
    
    clear
    echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                        🎉 Success!                             ║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${GREEN}🎵 EchoTune AI has been successfully deployed!${NC}"
    echo ""
    
    echo -e "${WHITE}📍 Access Points:${NC}"
    echo "• 🌐 Web Application: http://localhost:3000"
    echo "• 🔧 Health Check: http://localhost:3000/health"
    echo "• 📊 API Status: http://localhost:3000/api/status"
    echo ""
    
    echo -e "${WHITE}🚀 Quick Commands:${NC}"
    echo "• npm start                    # Start the application"
    echo "• npm run health-check         # Check application health"
    echo "• npm run mcp-server          # Start automation server"
    echo "• ./deploy-clean.sh           # Quick redeploy"
    echo ""
    
    echo -e "${WHITE}🎯 Next Steps:${NC}"
    echo "1. 🎵 Visit http://localhost:3000 and explore the interface"
    echo "2. 🔗 Connect your Spotify account for personalized recommendations"
    echo "3. 💬 Try the AI chat feature for music discovery"
    echo "4. 📊 Upload your listening history for better recommendations"
    echo ""
    
    echo -e "${WHITE}💡 Pro Tips:${NC}"
    echo "• Use the conversational AI to discover new music"
    echo "• Upload your Spotify data for advanced analytics"
    echo "• Try different AI models for varied recommendation styles"
    echo "• Check the MCP automation features for advanced workflows"
    echo ""
    
    echo -e "${YELLOW}❓ Need Help?${NC}"
    echo "• 📚 Documentation: README.md"
    echo "• 🐛 Issues: https://github.com/dzp5103/Spotify-echo/issues"
    echo "• 💬 Discord: [Join our community]"
    echo ""
    
    echo -e "${GREEN}Happy music discovering! 🎶${NC}"
    echo ""
}

# Main wizard flow
main() {
    # Introduction
    show_introduction
    
    # Step 1: System requirements
    if ! check_system_requirements; then
        log_error "System requirements not met. Please install missing components and try again."
        exit 1
    fi
    
    # Step 2: Choose deployment method
    local deployment_method
    deployment_method=$(choose_deployment_method)
    log_success "Selected deployment method: $deployment_method"
    
    # Step 3: Configuration
    setup_configuration "$deployment_method"
    
    # Step 4: Deploy
    if deploy_application "$deployment_method"; then
        # Step 5: Completion
        show_completion "$deployment_method"
    else
        log_error "Deployment failed. Please check the error messages above."
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    "--help"|"-h")
        echo "EchoTune AI Deployment Wizard v$WIZARD_VERSION"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h    Show this help message"
        echo "  --version, -v Show version information"
        echo ""
        echo "This interactive wizard will guide you through deploying EchoTune AI"
        echo "step by step, with no technical knowledge required."
        echo ""
        exit 0
        ;;
    "--version"|"-v")
        echo "EchoTune AI Deployment Wizard v$WIZARD_VERSION"
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac