#!/usr/bin/env node
/**
 * GitHub Repos Manager MCP Server for EchoTune AI
 * Provides comprehensive GitHub repository management and automation tools
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { Octokit } = require('@octokit/rest');

class GitHubReposManagerMCP {
    constructor() {
        this.server = new Server(
            { name: 'github-repos-manager-mcp', version: '1.0.0' },
            { capabilities: { tools: {} } }
        );
        
        this.octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN || process.env.GITHUB_PAT
        });
        
        this.setupTools();
    }

    setupTools() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'list_repositories',
                        description: 'List repositories for a user or organization',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                owner: {
                                    type: 'string',
                                    description: 'Username or organization name'
                                },
                                type: {
                                    type: 'string',
                                    description: 'Repository type: all, owner, public, private',
                                    default: 'all'
                                },
                                sort: {
                                    type: 'string',
                                    description: 'Sort by: created, updated, pushed, full_name',
                                    default: 'updated'
                                },
                                per_page: {
                                    type: 'number',
                                    description: 'Results per page (max 100)',
                                    default: 30
                                }
                            },
                            required: ['owner']
                        }
                    },
                    {
                        name: 'get_repository',
                        description: 'Get detailed information about a repository',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                owner: {
                                    type: 'string',
                                    description: 'Repository owner'
                                },
                                repo: {
                                    type: 'string',
                                    description: 'Repository name'
                                }
                            },
                            required: ['owner', 'repo']
                        }
                    },
                    {
                        name: 'list_issues',
                        description: 'List issues for a repository',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                owner: {
                                    type: 'string',
                                    description: 'Repository owner'
                                },
                                repo: {
                                    type: 'string',
                                    description: 'Repository name'
                                },
                                state: {
                                    type: 'string',
                                    description: 'Issue state: open, closed, all',
                                    default: 'open'
                                },
                                labels: {
                                    type: 'string',
                                    description: 'Comma-separated list of labels'
                                },
                                per_page: {
                                    type: 'number',
                                    description: 'Results per page (max 100)',
                                    default: 30
                                }
                            },
                            required: ['owner', 'repo']
                        }
                    },
                    {
                        name: 'create_issue',
                        description: 'Create a new issue',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                owner: {
                                    type: 'string',
                                    description: 'Repository owner'
                                },
                                repo: {
                                    type: 'string',
                                    description: 'Repository name'
                                },
                                title: {
                                    type: 'string',
                                    description: 'Issue title'
                                },
                                body: {
                                    type: 'string',
                                    description: 'Issue description'
                                },
                                labels: {
                                    type: 'array',
                                    description: 'Array of label names',
                                    items: { type: 'string' }
                                }
                            },
                            required: ['owner', 'repo', 'title']
                        }
                    },
                    {
                        name: 'list_pull_requests',
                        description: 'List pull requests for a repository',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                owner: {
                                    type: 'string',
                                    description: 'Repository owner'
                                },
                                repo: {
                                    type: 'string',
                                    description: 'Repository name'
                                },
                                state: {
                                    type: 'string',
                                    description: 'PR state: open, closed, all',
                                    default: 'open'
                                },
                                base: {
                                    type: 'string',
                                    description: 'Base branch name'
                                },
                                head: {
                                    type: 'string',
                                    description: 'Head branch name'
                                },
                                per_page: {
                                    type: 'number',
                                    description: 'Results per page (max 100)',
                                    default: 30
                                }
                            },
                            required: ['owner', 'repo']
                        }
                    },
                    {
                        name: 'get_file_content',
                        description: 'Get content of a file from repository',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                owner: {
                                    type: 'string',
                                    description: 'Repository owner'
                                },
                                repo: {
                                    type: 'string',
                                    description: 'Repository name'
                                },
                                path: {
                                    type: 'string',
                                    description: 'File path'
                                },
                                ref: {
                                    type: 'string',
                                    description: 'Branch, tag, or commit SHA'
                                }
                            },
                            required: ['owner', 'repo', 'path']
                        }
                    },
                    {
                        name: 'list_commits',
                        description: 'List commits for a repository',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                owner: {
                                    type: 'string',
                                    description: 'Repository owner'
                                },
                                repo: {
                                    type: 'string',
                                    description: 'Repository name'
                                },
                                sha: {
                                    type: 'string',
                                    description: 'Branch, tag, or commit SHA'
                                },
                                path: {
                                    type: 'string',
                                    description: 'File path to filter commits'
                                },
                                per_page: {
                                    type: 'number',
                                    description: 'Results per page (max 100)',
                                    default: 30
                                }
                            },
                            required: ['owner', 'repo']
                        }
                    },
                    {
                        name: 'search_repositories',
                        description: 'Search repositories on GitHub',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                q: {
                                    type: 'string',
                                    description: 'Search query'
                                },
                                sort: {
                                    type: 'string',
                                    description: 'Sort by: stars, forks, updated',
                                    default: 'stars'
                                },
                                order: {
                                    type: 'string',
                                    description: 'Sort order: asc, desc',
                                    default: 'desc'
                                },
                                per_page: {
                                    type: 'number',
                                    description: 'Results per page (max 100)',
                                    default: 30
                                }
                            },
                            required: ['q']
                        }
                    },
                    {
                        name: 'get_repository_stats',
                        description: 'Get repository statistics and metrics',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                owner: {
                                    type: 'string',
                                    description: 'Repository owner'
                                },
                                repo: {
                                    type: 'string',
                                    description: 'Repository name'
                                }
                            },
                            required: ['owner', 'repo']
                        }
                    },
                    {
                        name: 'manage_repository',
                        description: 'Update repository settings',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                owner: {
                                    type: 'string',
                                    description: 'Repository owner'
                                },
                                repo: {
                                    type: 'string',
                                    description: 'Repository name'
                                },
                                description: {
                                    type: 'string',
                                    description: 'Repository description'
                                },
                                private: {
                                    type: 'boolean',
                                    description: 'Make repository private'
                                },
                                topics: {
                                    type: 'array',
                                    description: 'Repository topics',
                                    items: { type: 'string' }
                                }
                            },
                            required: ['owner', 'repo']
                        }
                    }
                ]
            };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            
            try {
                switch (name) {
                    case 'list_repositories':
                        return await this.listRepositories(args);
                    case 'get_repository':
                        return await this.getRepository(args.owner, args.repo);
                    case 'list_issues':
                        return await this.listIssues(args);
                    case 'create_issue':
                        return await this.createIssue(args);
                    case 'list_pull_requests':
                        return await this.listPullRequests(args);
                    case 'get_file_content':
                        return await this.getFileContent(args);
                    case 'list_commits':
                        return await this.listCommits(args);
                    case 'search_repositories':
                        return await this.searchRepositories(args);
                    case 'get_repository_stats':
                        return await this.getRepositoryStats(args.owner, args.repo);
                    case 'manage_repository':
                        return await this.manageRepository(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error.message}`
                        }
                    ]
                };
            }
        });
    }

    async listRepositories(params) {
        const { data } = await this.octokit.repos.listForUser({
            username: params.owner,
            type: params.type || 'all',
            sort: params.sort || 'updated',
            per_page: params.per_page || 30
        });

        const repos = data.map(repo => ({
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            private: repo.private,
            html_url: repo.html_url,
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            updated_at: repo.updated_at
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(repos, null, 2)
                }
            ]
        };
    }

    async getRepository(owner, repo) {
        const { data } = await this.octokit.repos.get({
            owner,
            repo
        });

        const repoInfo = {
            name: data.name,
            full_name: data.full_name,
            description: data.description,
            private: data.private,
            html_url: data.html_url,
            clone_url: data.clone_url,
            language: data.language,
            languages_url: data.languages_url,
            topics: data.topics,
            stars: data.stargazers_count,
            forks: data.forks_count,
            watchers: data.watchers_count,
            open_issues: data.open_issues_count,
            default_branch: data.default_branch,
            created_at: data.created_at,
            updated_at: data.updated_at,
            pushed_at: data.pushed_at,
            size: data.size
        };

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(repoInfo, null, 2)
                }
            ]
        };
    }

    async listIssues(params) {
        const { data } = await this.octokit.issues.listForRepo({
            owner: params.owner,
            repo: params.repo,
            state: params.state || 'open',
            labels: params.labels,
            per_page: params.per_page || 30
        });

        const issues = data.map(issue => ({
            number: issue.number,
            title: issue.title,
            state: issue.state,
            labels: issue.labels.map(label => label.name),
            assignees: issue.assignees.map(assignee => assignee.login),
            created_at: issue.created_at,
            updated_at: issue.updated_at,
            html_url: issue.html_url
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(issues, null, 2)
                }
            ]
        };
    }

    async createIssue(params) {
        const { data } = await this.octokit.issues.create({
            owner: params.owner,
            repo: params.repo,
            title: params.title,
            body: params.body,
            labels: params.labels
        });

        return {
            content: [
                {
                    type: 'text',
                    text: `Issue created successfully: #${data.number} - ${data.title}\nURL: ${data.html_url}`
                }
            ]
        };
    }

    async listPullRequests(params) {
        const { data } = await this.octokit.pulls.list({
            owner: params.owner,
            repo: params.repo,
            state: params.state || 'open',
            base: params.base,
            head: params.head,
            per_page: params.per_page || 30
        });

        const prs = data.map(pr => ({
            number: pr.number,
            title: pr.title,
            state: pr.state,
            base: pr.base.ref,
            head: pr.head.ref,
            user: pr.user.login,
            created_at: pr.created_at,
            updated_at: pr.updated_at,
            html_url: pr.html_url
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(prs, null, 2)
                }
            ]
        };
    }

    async getFileContent(params) {
        const { data } = await this.octokit.repos.getContent({
            owner: params.owner,
            repo: params.repo,
            path: params.path,
            ref: params.ref
        });

        if (data.type === 'file') {
            const content = Buffer.from(data.content, 'base64').toString('utf8');
            return {
                content: [
                    {
                        type: 'text',
                        text: `File: ${data.path}\nSize: ${data.size} bytes\nSHA: ${data.sha}\n\nContent:\n${content}`
                    }
                ]
            };
        } else {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Path "${params.path}" is a directory, not a file`
                    }
                ]
            };
        }
    }

    async listCommits(params) {
        const { data } = await this.octokit.repos.listCommits({
            owner: params.owner,
            repo: params.repo,
            sha: params.sha,
            path: params.path,
            per_page: params.per_page || 30
        });

        const commits = data.map(commit => ({
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author.name,
            date: commit.commit.author.date,
            html_url: commit.html_url
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(commits, null, 2)
                }
            ]
        };
    }

    async searchRepositories(params) {
        const { data } = await this.octokit.search.repos({
            q: params.q,
            sort: params.sort || 'stars',
            order: params.order || 'desc',
            per_page: params.per_page || 30
        });

        const repos = data.items.map(repo => ({
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            html_url: repo.html_url
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: `Search results for "${params.q}":\n${JSON.stringify(repos, null, 2)}`
                }
            ]
        };
    }

    async getRepositoryStats(owner, repo) {
        try {
            const [repoData, contributorsData, languagesData] = await Promise.all([
                this.octokit.repos.get({ owner, repo }),
                this.octokit.repos.listContributors({ owner, repo }),
                this.octokit.repos.listLanguages({ owner, repo })
            ]);

            const stats = {
                repository: repoData.data.name,
                description: repoData.data.description,
                stars: repoData.data.stargazers_count,
                forks: repoData.data.forks_count,
                watchers: repoData.data.watchers_count,
                open_issues: repoData.data.open_issues_count,
                size: repoData.data.size,
                contributors: contributorsData.data.length,
                languages: languagesData.data,
                created_at: repoData.data.created_at,
                updated_at: repoData.data.updated_at
            };

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(stats, null, 2)
                    }
                ]
            };
        } catch (error) {
            throw new Error(`Failed to get repository stats: ${error.message}`);
        }
    }

    async manageRepository(params) {
        const updateData = {};
        
        if (params.description !== undefined) {
            updateData.description = params.description;
        }
        
        if (params.private !== undefined) {
            updateData.private = params.private;
        }

        const { data } = await this.octokit.repos.update({
            owner: params.owner,
            repo: params.repo,
            ...updateData
        });

        // Update topics if provided
        if (params.topics) {
            await this.octokit.repos.replaceAllTopics({
                owner: params.owner,
                repo: params.repo,
                names: params.topics
            });
        }

        return {
            content: [
                {
                    type: 'text',
                    text: `Repository ${params.owner}/${params.repo} updated successfully`
                }
            ]
        };
    }

    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('GitHub Repos Manager MCP Server running on stdio');
    }
}

if (require.main === module) {
    const server = new GitHubReposManagerMCP();
    server.start().catch(console.error);
}

module.exports = GitHubReposManagerMCP;