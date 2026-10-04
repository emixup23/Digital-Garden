import React from 'react';
import {
  // Lucide: Folders & Storage
  Folder,
  FolderOpen,
  FolderArchive,
  FolderGit2,
  FolderTree,
  FolderHeart,
  FolderKanban,
  FolderKey,
  FolderLock,
  FolderRoot,
  FolderSync,
  FolderSearch,
  FolderPlus,
  FolderCode,
  FolderClock,
  FolderCheck,
  Archive,
  Package,
  Box,
  Boxes,
  Layers,
  HardDrive,
  Database,
  Server,
  Inbox,
  Briefcase,
  // Lucide: Notes & Docs
  FileText,
  BookOpen,
  Notebook,
  BookMarked,
  Scroll,
  PenTool,
  Feather,
  Newspaper,
  GraduationCap,
  Quote,
  Library,
  Bookmark,
  FileQuestion,
  FileCheck,
  StickyNote,
  FileSpreadsheet,
  FileCode,
  // Lucide: Tech & Systems
  Terminal,
  Cpu,
  Binary,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  Bug,
  Code2,
  Workflow,
  Braces,
  Hash,
  Shield,
  Key,
  Lock,
  Unlock,
  Wifi,
  Cloud,
  Laptop,
  Bot,
  // Lucide: Science & Mind
  Brain,
  Lightbulb,
  Sparkles,
  Atom,
  FlaskConical,
  Telescope,
  Zap,
  Flame,
  Rocket,
  Target,
  Infinity as InfinityIcon,
  Activity,
  Compass,
  Microscope,
  Dna,
  Gauge,
  // Lucide: Organization
  Calendar,
  CheckSquare,
  ListTodo,
  Clock,
  Timer,
  Flag,
  Pin,
  MapPin,
  Milestone,
  Navigation,
  PieChart,
  BarChart3,
  TrendingUp,
  // Lucide: Symbols & Media
  Image,
  Music,
  Video,
  Headphones,
  Mic,
  Film,
  Camera,
  Palette,
  Brush,
  Heart,
  Star,
  Award,
  Crown,
  Sun,
  Moon,
  Coffee,
  Gem,
  ShieldAlert,
  Eye,
  Glasses,
  Smile,
  Globe,
  LucideIcon,
} from 'lucide-react';

// Simple Icons: Linux Distros, Cloud Hyperscalers, SysAdmin, DevOps & DBs
import {
  // Linux Distros & Kernels
  SiLinux,
  SiUbuntu,
  SiDebian,
  SiArchlinux,
  SiFedora,
  SiRedhat,
  SiCentos,
  SiAlpinelinux,
  SiKalilinux,
  SiOpensuse,
  SiGentoo,
  SiNixos,
  SiRockylinux,
  SiAlmalinux,
  SiLinuxmint,
  SiFreebsd,
  SiRaspberrypi,
  SiGnu,
  SiGnubash,
  SiZsh,
  SiGnuemacs,
  SiLinuxcontainers,
  SiLinuxserver,
  // SysAdmin, DevOps & Orchestration
  SiDocker,
  SiKubernetes,
  SiPodman,
  SiAnsible,
  SiTerraform,
  SiHelm,
  SiPuppet,
  SiNginx,
  SiNginxproxymanager,
  SiApache,
  SiCaddy,
  SiTraefikproxy,
  SiTmux,
  SiVim,
  SiNeovim,
  SiWireguard,
  SiLetsencrypt,
  SiPrometheus,
  SiGrafana,
  SiDatadog,
  SiElasticsearch,
  SiLogstash,
  SiKibana,
  SiGitlab,
  SiGithubactions,
  SiJenkins,
  SiArgo,
  SiVault,
  SiConsul,
  SiPortainer,
  // Cloud Hyperscalers & Platforms
  SiGooglecloud,
  SiGooglecloudstorage,
  SiGooglebigquery,
  SiGooglecontaineroptimizedos,
  SiCloudflare,
  SiDigitalocean,
  SiHetzner,
  SiVultr,
  SiOpenstack,
  SiVercel,
  SiNetlify,
  SiSupabase,
  SiFirebase,
  SiFastly,
  SiFlydotio,
  SiRender,
  SiRailway,
  SiScaleway,
  SiAkamai,
  // Databases & Storage
  SiPostgresql,
  SiMysql,
  SiMariadb,
  SiRedis,
  SiMongodb,
  SiSqlite,
  SiApachecassandra,
  SiApachekafka,
  SiRabbitmq,
  SiMinio,
  SiCeph,
  // Networking & Security
  SiOpenvpn,
  SiTorproject,
  SiWireshark,
  SiTailscale,
  SiGnuprivacyguard,
  SiCurl,
} from 'react-icons/si';

// Font Awesome 6: Hardware, Server Racks, Terminals, Cloud & Infra
import {
  FaAws,
  FaCloud,
  FaCloudArrowUp,
  FaCloudArrowDown,
  FaCloudflare,
  FaServer,
  FaTerminal,
  FaNetworkWired,
  FaHardDrive,
  FaMicrochip,
  FaDatabase,
  FaEthernet,
  FaKey,
  FaLock,
  FaShieldHalved,
  FaLinux,
  FaUbuntu,
  FaDebian,
  FaRedhat,
  FaFedora,
  FaCentos,
  FaSuse,
  FaOpensuse,
  FaDocker,
} from 'react-icons/fa6';

// VS Code Codicons: Virtual Machines, Azure, Azure DevOps, Server Processes
import {
  VscAzure,
  VscAzureDevops,
  VscTerminalLinux,
  VscTerminalUbuntu,
  VscTerminalDebian,
  VscTerminalBash,
  VscTerminalTmux,
  VscServer,
  VscServerProcess,
  VscServerEnvironment,
  VscVm,
  VscVmRunning,
  VscVmConnect,
  VscCloud,
  VscCircuitBoard,
} from 'react-icons/vsc';

// Devicons: Classic Developer, Cloud & SysAdmin Icons
import {
  DiAws,
  DiGoogleCloudPlatform,
  DiLinux,
  DiUbuntu,
  DiDebian,
  DiDocker,
  DiNginx,
  DiTerminalBadge,
  DiTerminal,
  DiDatabase,
} from 'react-icons/di';

export type IconLibraryId = 'all' | 'si' | 'fa6' | 'vsc' | 'di' | 'lucide';

export type IconCategory =
  | 'all'
  | 'linux'
  | 'sysadmin'
  | 'cloud'
  | 'database'
  | 'network'
  | 'folders'
  | 'docs'
  | 'code'
  | 'ideas'
  | 'organize'
  | 'symbols';

export interface IconDefinition {
  name: string;
  label: string;
  category: IconCategory;
  library: 'si' | 'fa6' | 'vsc' | 'di' | 'lucide';
  component: React.ComponentType<{ className?: string; style?: React.CSSProperties; size?: string | number }>;
  keywords: string[];
}

export const ICON_LIBRARIES: { id: IconLibraryId; label: string; badge: string; description: string }[] = [
  { id: 'all', label: 'All Libraries', badge: 'ALL', description: 'Search across all icon collections' },
  { id: 'si', label: 'Simple Icons', badge: 'SI', description: 'Authentic Linux distros, cloud brands & sysadmin tools' },
  { id: 'fa6', label: 'Font Awesome 6', badge: 'FA6', description: 'Hardware, server racks, terminals & cloud infra' },
  { id: 'vsc', label: 'VS Code Codicons', badge: 'VSC', description: 'Virtual machines, Azure & terminal consoles' },
  { id: 'di', label: 'Devicons', badge: 'DI', description: 'Classic developer & sysadmin icons' },
  { id: 'lucide', label: 'Lucide Icons', badge: 'LUCIDE', description: 'Modern minimalist vector stroke icons' },
];

export const ICON_CATEGORIES: { id: IconCategory; label: string }[] = [
  { id: 'all', label: 'All Icons' },
  { id: 'linux', label: '🐧 Linux & Distros' },
  { id: 'sysadmin', label: '⚙️ SysAdmin & DevOps' },
  { id: 'cloud', label: '☁️ Cloud & Infra' },
  { id: 'database', label: '💾 Databases & Storage' },
  { id: 'network', label: '🛡️ Network & Security' },
  { id: 'code', label: '💻 Code & Dev' },
  { id: 'folders', label: '📁 Folders & Vaults' },
  { id: 'docs', label: '📝 Notes & Docs' },
  { id: 'ideas', label: '🧠 Mind & Science' },
  { id: 'organize', label: '📅 Organization' },
  { id: 'symbols', label: '✨ Symbols & Media' },
];

export const ICON_LIBRARY: IconDefinition[] = [
  // ==========================================
  // 🐧 LINUX & DISTRIBUTIONS
  // ==========================================
  { name: 'SiLinux', label: 'Linux (Tux)', category: 'linux', library: 'si', component: SiLinux, keywords: ['linux', 'tux', 'kernel', 'os', 'unix', 'gnu'] },
  { name: 'FaLinux', label: 'Linux Tux (FA6)', category: 'linux', library: 'fa6', component: FaLinux, keywords: ['linux', 'penguin', 'tux', 'fa', 'os'] },
  { name: 'DiLinux', label: 'Linux (Classic DI)', category: 'linux', library: 'di', component: DiLinux, keywords: ['linux', 'classic', 'devicon', 'unix'] },
  { name: 'SiUbuntu', label: 'Ubuntu Linux', category: 'linux', library: 'si', component: SiUbuntu, keywords: ['ubuntu', 'canonical', 'debian', 'distro', 'linux'] },
  { name: 'FaUbuntu', label: 'Ubuntu (FA6)', category: 'linux', library: 'fa6', component: FaUbuntu, keywords: ['ubuntu', 'fa', 'linux', 'server'] },
  { name: 'DiUbuntu', label: 'Ubuntu (DI)', category: 'linux', library: 'di', component: DiUbuntu, keywords: ['ubuntu', 'devicon', 'linux'] },
  { name: 'SiDebian', label: 'Debian Linux', category: 'linux', library: 'si', component: SiDebian, keywords: ['debian', 'spiral', 'apt', 'dpkg', 'stable', 'linux'] },
  { name: 'FaDebian', label: 'Debian (FA6)', category: 'linux', library: 'fa6', component: FaDebian, keywords: ['debian', 'fa', 'distro', 'linux'] },
  { name: 'DiDebian', label: 'Debian (DI)', category: 'linux', library: 'di', component: DiDebian, keywords: ['debian', 'devicon', 'linux'] },
  { name: 'SiArchlinux', label: 'Arch Linux', category: 'linux', library: 'si', component: SiArchlinux, keywords: ['arch', 'archlinux', 'pacman', 'rolling', 'btw'] },
  { name: 'SiFedora', label: 'Fedora Linux', category: 'linux', library: 'si', component: SiFedora, keywords: ['fedora', 'redhat', 'rpm', 'dnf', 'linux'] },
  { name: 'FaFedora', label: 'Fedora (FA6)', category: 'linux', library: 'fa6', component: FaFedora, keywords: ['fedora', 'fa', 'linux'] },
  { name: 'SiRedhat', label: 'Red Hat Enterprise', category: 'linux', library: 'si', component: SiRedhat, keywords: ['redhat', 'rhel', 'enterprise', 'linux', 'shadowman'] },
  { name: 'FaRedhat', label: 'Red Hat (FA6)', category: 'linux', library: 'fa6', component: FaRedhat, keywords: ['redhat', 'fa', 'rhel'] },
  { name: 'SiCentos', label: 'CentOS Linux', category: 'linux', library: 'si', component: SiCentos, keywords: ['centos', 'stream', 'rhel', 'server', 'linux'] },
  { name: 'FaCentos', label: 'CentOS (FA6)', category: 'linux', library: 'fa6', component: FaCentos, keywords: ['centos', 'fa', 'linux'] },
  { name: 'SiAlpinelinux', label: 'Alpine Linux', category: 'linux', library: 'si', component: SiAlpinelinux, keywords: ['alpine', 'docker', 'lightweight', 'musl', 'apk', 'container'] },
  { name: 'SiKalilinux', label: 'Kali Linux', category: 'linux', library: 'si', component: SiKalilinux, keywords: ['kali', 'security', 'pentest', 'offensive', 'dragon', 'hacker'] },
  { name: 'SiOpensuse', label: 'openSUSE', category: 'linux', library: 'si', component: SiOpensuse, keywords: ['suse', 'opensuse', 'geeko', 'zypper', 'chameleon'] },
  { name: 'FaOpensuse', label: 'openSUSE (FA6)', category: 'linux', library: 'fa6', component: FaOpensuse, keywords: ['opensuse', 'fa', 'suse'] },
  { name: 'FaSuse', label: 'SUSE Enterprise (FA6)', category: 'linux', library: 'fa6', component: FaSuse, keywords: ['suse', 'fa', 'enterprise', 'linux'] },
  { name: 'SiGentoo', label: 'Gentoo Linux', category: 'linux', library: 'si', component: SiGentoo, keywords: ['gentoo', 'portage', 'compile', 'source', 'linux'] },
  { name: 'SiNixos', label: 'NixOS', category: 'linux', library: 'si', component: SiNixos, keywords: ['nix', 'nixos', 'reproducible', 'declarative', 'snowflake'] },
  { name: 'SiRockylinux', label: 'Rocky Linux', category: 'linux', library: 'si', component: SiRockylinux, keywords: ['rocky', 'rhel', 'enterprise', 'centos', 'server'] },
  { name: 'SiAlmalinux', label: 'AlmaLinux', category: 'linux', library: 'si', component: SiAlmalinux, keywords: ['alma', 'almalinux', 'rhel', 'enterprise', 'server'] },
  { name: 'SiLinuxmint', label: 'Linux Mint', category: 'linux', library: 'si', component: SiLinuxmint, keywords: ['mint', 'cinnamon', 'desktop', 'linux'] },
  { name: 'SiFreebsd', label: 'FreeBSD / BSD', category: 'linux', library: 'si', component: SiFreebsd, keywords: ['freebsd', 'bsd', 'unix', 'daemon', 'beastie'] },
  { name: 'SiRaspberrypi', label: 'Raspberry Pi OS', category: 'linux', library: 'si', component: SiRaspberrypi, keywords: ['raspberry', 'pi', 'arm', 'embedded', 'raspbian', 'iot'] },
  { name: 'SiGnu', label: 'GNU Project', category: 'linux', library: 'si', component: SiGnu, keywords: ['gnu', 'fsf', 'stallman', 'free software', 'gpl'] },
  { name: 'SiGnubash', label: 'Bash Shell', category: 'linux', library: 'si', component: SiGnubash, keywords: ['bash', 'sh', 'shell', 'terminal', 'script', 'cli'] },
  { name: 'SiZsh', label: 'Zsh / Z Shell', category: 'linux', library: 'si', component: SiZsh, keywords: ['zsh', 'oh-my-zsh', 'terminal', 'shell', 'cli'] },
  { name: 'SiGnuemacs', label: 'GNU Emacs', category: 'linux', library: 'si', component: SiGnuemacs, keywords: ['emacs', 'gnu', 'editor', 'lisp', 'org-mode'] },
  { name: 'SiLinuxcontainers', label: 'LXC / Linux Containers', category: 'linux', library: 'si', component: SiLinuxcontainers, keywords: ['lxc', 'lxd', 'cgroups', 'containers', 'namespaces'] },
  { name: 'SiLinuxserver', label: 'LinuxServer.io', category: 'linux', library: 'si', component: SiLinuxserver, keywords: ['linuxserver', 'docker', 'homelab', 'selfhosted'] },
  { name: 'VscTerminalLinux', label: 'Linux Terminal (VSC)', category: 'linux', library: 'vsc', component: VscTerminalLinux, keywords: ['terminal', 'linux', 'vsc', 'console'] },
  { name: 'VscTerminalUbuntu', label: 'Ubuntu Terminal (VSC)', category: 'linux', library: 'vsc', component: VscTerminalUbuntu, keywords: ['ubuntu', 'terminal', 'vsc', 'shell'] },
  { name: 'VscTerminalDebian', label: 'Debian Terminal (VSC)', category: 'linux', library: 'vsc', component: VscTerminalDebian, keywords: ['debian', 'terminal', 'vsc', 'cli'] },

  // ==========================================
  // ⚙️ SYSADMIN, DEVOPS & ORCHESTRATION
  // ==========================================
  { name: 'SiDocker', label: 'Docker Engine', category: 'sysadmin', library: 'si', component: SiDocker, keywords: ['docker', 'container', 'whale', 'image', 'compose', 'swarm'] },
  { name: 'FaDocker', label: 'Docker (FA6)', category: 'sysadmin', library: 'fa6', component: FaDocker, keywords: ['docker', 'fa', 'container', 'virtualization'] },
  { name: 'DiDocker', label: 'Docker (DI)', category: 'sysadmin', library: 'di', component: DiDocker, keywords: ['docker', 'devicon', 'container'] },
  { name: 'SiKubernetes', label: 'Kubernetes (K8s)', category: 'sysadmin', library: 'si', component: SiKubernetes, keywords: ['k8s', 'kubernetes', 'cluster', 'orchestration', 'pods', 'helm'] },
  { name: 'SiPodman', label: 'Podman Containers', category: 'sysadmin', library: 'si', component: SiPodman, keywords: ['podman', 'rootless', 'containers', 'oci', 'redhat'] },
  { name: 'SiAnsible', label: 'Ansible Automation', category: 'sysadmin', library: 'si', component: SiAnsible, keywords: ['ansible', 'automation', 'playbook', 'iac', 'redhat', 'devops'] },
  { name: 'SiTerraform', label: 'HashiCorp Terraform', category: 'sysadmin', library: 'si', component: SiTerraform, keywords: ['terraform', 'hcl', 'iac', 'hashicorp', 'infra', 'provision'] },
  { name: 'SiHelm', label: 'Helm K8s Package Manager', category: 'sysadmin', library: 'si', component: SiHelm, keywords: ['helm', 'charts', 'k8s', 'kubernetes', 'package'] },
  { name: 'SiPuppet', label: 'Puppet Config Mgmt', category: 'sysadmin', library: 'si', component: SiPuppet, keywords: ['puppet', 'configuration', 'devops', 'automation'] },
  { name: 'SiNginx', label: 'Nginx Web Server', category: 'sysadmin', library: 'si', component: SiNginx, keywords: ['nginx', 'reverse proxy', 'webserver', 'http', 'loadbalancer'] },
  { name: 'DiNginx', label: 'Nginx (DI)', category: 'sysadmin', library: 'di', component: DiNginx, keywords: ['nginx', 'devicon', 'webserver'] },
  { name: 'SiNginxproxymanager', label: 'Nginx Proxy Manager', category: 'sysadmin', library: 'si', component: SiNginxproxymanager, keywords: ['npm', 'nginx proxy', 'ssl', 'homelab'] },
  { name: 'SiApache', label: 'Apache HTTP Server', category: 'sysadmin', library: 'si', component: SiApache, keywords: ['apache', 'httpd', 'feather', 'webserver', 'lamp'] },
  { name: 'SiCaddy', label: 'Caddy Web Server', category: 'sysadmin', library: 'si', component: SiCaddy, keywords: ['caddy', 'https', 'autossl', 'webserver', 'golang'] },
  { name: 'SiTraefikproxy', label: 'Traefik Edge Router', category: 'sysadmin', library: 'si', component: SiTraefikproxy, keywords: ['traefik', 'proxy', 'ingress', 'cloud native', 'microservices'] },
  { name: 'SiTmux', label: 'Tmux Terminal Multiplexer', category: 'sysadmin', library: 'si', component: SiTmux, keywords: ['tmux', 'terminal', 'multiplexer', 'split', 'session', 'cli'] },
  { name: 'SiVim', label: 'Vim Editor', category: 'sysadmin', library: 'si', component: SiVim, keywords: ['vim', 'vi', 'editor', 'modal', 'cli', 'sysadmin'] },
  { name: 'SiNeovim', label: 'Neovim (Lua)', category: 'sysadmin', library: 'si', component: SiNeovim, keywords: ['neovim', 'nvim', 'lua', 'editor', 'ide', 'cli'] },
  { name: 'SiPrometheus', label: 'Prometheus Monitoring', category: 'sysadmin', library: 'si', component: SiPrometheus, keywords: ['prometheus', 'metrics', 'monitoring', 'alerting', 'time series'] },
  { name: 'SiGrafana', label: 'Grafana Dashboards', category: 'sysadmin', library: 'si', component: SiGrafana, keywords: ['grafana', 'dashboards', 'observability', 'telemetry', 'charts'] },
  { name: 'SiDatadog', label: 'Datadog Observability', category: 'sysadmin', library: 'si', component: SiDatadog, keywords: ['datadog', 'apm', 'logs', 'metrics', 'cloud monitoring'] },
  { name: 'SiElasticsearch', label: 'Elasticsearch (ELK)', category: 'sysadmin', library: 'si', component: SiElasticsearch, keywords: ['elastic', 'elasticsearch', 'search', 'elk', 'logs', 'lucene'] },
  { name: 'SiLogstash', label: 'Logstash Pipeline', category: 'sysadmin', library: 'si', component: SiLogstash, keywords: ['logstash', 'elk', 'pipeline', 'parsing', 'ingest'] },
  { name: 'SiKibana', label: 'Kibana Visualizer', category: 'sysadmin', library: 'si', component: SiKibana, keywords: ['kibana', 'elk', 'analytics', 'dashboards'] },
  { name: 'SiGitlab', label: 'GitLab CI / DevOps', category: 'sysadmin', library: 'si', component: SiGitlab, keywords: ['gitlab', 'ci/cd', 'devops', 'pipeline', 'git'] },
  { name: 'SiGithubactions', label: 'GitHub Actions CI', category: 'sysadmin', library: 'si', component: SiGithubactions, keywords: ['github', 'actions', 'workflows', 'ci/cd', 'runner'] },
  { name: 'SiJenkins', label: 'Jenkins Automation', category: 'sysadmin', library: 'si', component: SiJenkins, keywords: ['jenkins', 'ci/cd', 'butler', 'build', 'pipeline'] },
  { name: 'SiArgo', label: 'Argo CD (GitOps)', category: 'sysadmin', library: 'si', component: SiArgo, keywords: ['argo', 'argocd', 'gitops', 'k8s', 'kubernetes', 'deploy'] },
  { name: 'SiVault', label: 'HashiCorp Vault', category: 'sysadmin', library: 'si', component: SiVault, keywords: ['vault', 'secrets', 'encryption', 'hashicorp', 'pki', 'security'] },
  { name: 'SiConsul', label: 'HashiCorp Consul', category: 'sysadmin', library: 'si', component: SiConsul, keywords: ['consul', 'service mesh', 'dns', 'discovery', 'hashicorp'] },
  { name: 'SiPortainer', label: 'Portainer Management', category: 'sysadmin', library: 'si', component: SiPortainer, keywords: ['portainer', 'docker ui', 'k8s ui', 'container gui'] },
  { name: 'FaServer', label: 'Server Rack (FA6)', category: 'sysadmin', library: 'fa6', component: FaServer, keywords: ['server', 'rack', 'datacenter', 'host', 'fa'] },
  { name: 'FaTerminal', label: 'Terminal Prompt (FA6)', category: 'sysadmin', library: 'fa6', component: FaTerminal, keywords: ['terminal', 'prompt', 'cli', 'bash', 'fa'] },
  { name: 'FaMicrochip', label: 'Microchip CPU (FA6)', category: 'sysadmin', library: 'fa6', component: FaMicrochip, keywords: ['cpu', 'processor', 'hardware', 'chip', 'fa'] },
  { name: 'FaNetworkWired', label: 'Wired Network (FA6)', category: 'sysadmin', library: 'fa6', component: FaNetworkWired, keywords: ['network', 'lan', 'ethernet', 'wired', 'fa'] },
  { name: 'FaHardDrive', label: 'Hard Drive (FA6)', category: 'sysadmin', library: 'fa6', component: FaHardDrive, keywords: ['disk', 'storage', 'hdd', 'drive', 'fa'] },
  { name: 'VscServer', label: 'Server System (VSC)', category: 'sysadmin', library: 'vsc', component: VscServer, keywords: ['server', 'vsc', 'datacenter'] },
  { name: 'VscServerProcess', label: 'Server Daemon / Process', category: 'sysadmin', library: 'vsc', component: VscServerProcess, keywords: ['process', 'daemon', 'service', 'systemd', 'vsc'] },
  { name: 'VscServerEnvironment', label: 'Server Environment', category: 'sysadmin', library: 'vsc', component: VscServerEnvironment, keywords: ['env', 'environment', 'host', 'vsc'] },
  { name: 'VscVm', label: 'Virtual Machine (VM)', category: 'sysadmin', library: 'vsc', component: VscVm, keywords: ['vm', 'virtualbox', 'kvm', 'qemu', 'hypervisor', 'vsc'] },
  { name: 'VscVmRunning', label: 'Running VM Instance', category: 'sysadmin', library: 'vsc', component: VscVmRunning, keywords: ['vm', 'instance', 'running', 'compute', 'vsc'] },
  { name: 'VscVmConnect', label: 'VM Remote Connect (SSH)', category: 'sysadmin', library: 'vsc', component: VscVmConnect, keywords: ['ssh', 'connect', 'remote', 'vm', 'vsc'] },
  { name: 'VscCircuitBoard', label: 'Circuit Board / Hardware', category: 'sysadmin', library: 'vsc', component: VscCircuitBoard, keywords: ['hardware', 'motherboard', 'circuit', 'vsc'] },
  { name: 'DiTerminal', label: 'Classic Terminal (DI)', category: 'sysadmin', library: 'di', component: DiTerminal, keywords: ['terminal', 'devicon', 'cli'] },
  { name: 'DiTerminalBadge', label: 'Terminal Badge (DI)', category: 'sysadmin', library: 'di', component: DiTerminalBadge, keywords: ['terminal', 'badge', 'devicon'] },

  // ==========================================
  // ☁️ CLOUD PLATFORMS & INFRASTRUCTURE
  // ==========================================
  { name: 'FaAws', label: 'Amazon Web Services (AWS)', category: 'cloud', library: 'fa6', component: FaAws, keywords: ['aws', 'amazon', 'ec2', 's3', 'lambda', 'cloud'] },
  { name: 'DiAws', label: 'AWS Classic (DI)', category: 'cloud', library: 'di', component: DiAws, keywords: ['aws', 'devicon', 'cloud'] },
  { name: 'SiGooglecloud', label: 'Google Cloud Platform (GCP)', category: 'cloud', library: 'si', component: SiGooglecloud, keywords: ['gcp', 'google cloud', 'gke', 'cloud run', 'compute'] },
  { name: 'DiGoogleCloudPlatform', label: 'GCP Classic (DI)', category: 'cloud', library: 'di', component: DiGoogleCloudPlatform, keywords: ['gcp', 'google', 'devicon', 'cloud'] },
  { name: 'SiGooglecloudstorage', label: 'Google Cloud Storage (GCS)', category: 'cloud', library: 'si', component: SiGooglecloudstorage, keywords: ['gcs', 'bucket', 'blob', 'gcp', 'storage'] },
  { name: 'SiGooglebigquery', label: 'Google BigQuery', category: 'cloud', library: 'si', component: SiGooglebigquery, keywords: ['bigquery', 'sql', 'analytics', 'datawarehouse', 'gcp'] },
  { name: 'SiGooglecontaineroptimizedos', label: 'Container-Optimized OS (COS)', category: 'cloud', library: 'si', component: SiGooglecontaineroptimizedos, keywords: ['cos', 'gcp', 'container', 'kubernetes', 'os'] },
  { name: 'VscAzure', label: 'Microsoft Azure Cloud', category: 'cloud', library: 'vsc', component: VscAzure, keywords: ['azure', 'microsoft', 'vms', 'cloud', 'aks', 'vsc'] },
  { name: 'VscAzureDevops', label: 'Azure DevOps Services', category: 'cloud', library: 'vsc', component: VscAzureDevops, keywords: ['azure devops', 'pipelines', 'vsts', 'microsoft'] },
  { name: 'SiCloudflare', label: 'Cloudflare Edge / Workers', category: 'cloud', library: 'si', component: SiCloudflare, keywords: ['cloudflare', 'cdn', 'dns', 'workers', 'edge', 'waf'] },
  { name: 'FaCloudflare', label: 'Cloudflare (FA6)', category: 'cloud', library: 'fa6', component: FaCloudflare, keywords: ['cloudflare', 'fa', 'cdn', 'security'] },
  { name: 'SiDigitalocean', label: 'DigitalOcean Droplets', category: 'cloud', library: 'si', component: SiDigitalocean, keywords: ['digitalocean', 'droplets', 'vps', 'cloud', 'spaces'] },
  { name: 'SiHetzner', label: 'Hetzner Cloud & Bare Metal', category: 'cloud', library: 'si', component: SiHetzner, keywords: ['hetzner', 'vps', 'baremetal', 'germany', 'hosting', 'cloud'] },
  { name: 'SiVultr', label: 'Vultr Cloud Compute', category: 'cloud', library: 'si', component: SiVultr, keywords: ['vultr', 'vps', 'bare metal', 'cloud', 'compute'] },
  { name: 'SiOpenstack', label: 'OpenStack Private Cloud', category: 'cloud', library: 'si', component: SiOpenstack, keywords: ['openstack', 'private cloud', 'nova', 'neutron', 'infra'] },
  { name: 'SiVercel', label: 'Vercel Serverless Edge', category: 'cloud', library: 'si', component: SiVercel, keywords: ['vercel', 'serverless', 'edge', 'nextjs', 'deploy'] },
  { name: 'SiNetlify', label: 'Netlify Edge Cloud', category: 'cloud', library: 'si', component: SiNetlify, keywords: ['netlify', 'jamstack', 'edge', 'serverless', 'deploy'] },
  { name: 'SiSupabase', label: 'Supabase Postgres Cloud', category: 'cloud', library: 'si', component: SiSupabase, keywords: ['supabase', 'backend', 'postgres', 'baas', 'auth'] },
  { name: 'SiFirebase', label: 'Google Firebase Cloud', category: 'cloud', library: 'si', component: SiFirebase, keywords: ['firebase', 'firestore', 'auth', 'google', 'cloud'] },
  { name: 'SiFastly', label: 'Fastly Edge CDN', category: 'cloud', library: 'si', component: SiFastly, keywords: ['fastly', 'cdn', 'varnish', 'edge compute', 'wasm'] },
  { name: 'SiFlydotio', label: 'Fly.io Global Containers', category: 'cloud', library: 'si', component: SiFlydotio, keywords: ['fly.io', 'firecracker', 'global', 'edge', 'deploy'] },
  { name: 'SiRender', label: 'Render Cloud Application', category: 'cloud', library: 'si', component: SiRender, keywords: ['render', 'hosting', 'postgres', 'redis', 'web service'] },
  { name: 'SiRailway', label: 'Railway Cloud Platform', category: 'cloud', library: 'si', component: SiRailway, keywords: ['railway', 'deploy', 'containers', 'infra', 'devops'] },
  { name: 'SiScaleway', label: 'Scaleway Cloud Elements', category: 'cloud', library: 'si', component: SiScaleway, keywords: ['scaleway', 'cloud', 'vps', 'europe', 'instances'] },
  { name: 'SiAkamai', label: 'Akamai (Linode)', category: 'cloud', library: 'si', component: SiAkamai, keywords: ['akamai', 'linode', 'cdn', 'edge', 'cloud', 'vps'] },
  { name: 'FaCloud', label: 'Cloud Network (FA6)', category: 'cloud', library: 'fa6', component: FaCloud, keywords: ['cloud', 'fa', 'network', 'compute'] },
  { name: 'FaCloudArrowUp', label: 'Cloud Deploy / Upload (FA6)', category: 'cloud', library: 'fa6', component: FaCloudArrowUp, keywords: ['upload', 'cloud', 'deploy', 'fa'] },
  { name: 'FaCloudArrowDown', label: 'Cloud Sync / Download (FA6)', category: 'cloud', library: 'fa6', component: FaCloudArrowDown, keywords: ['download', 'sync', 'cloud', 'fa'] },
  { name: 'VscCloud', label: 'Cloud Infra (VSC)', category: 'cloud', library: 'vsc', component: VscCloud, keywords: ['cloud', 'vsc', 'service'] },

  // ==========================================
  // 💾 DATABASES & STORAGE
  // ==========================================
  { name: 'SiPostgresql', label: 'PostgreSQL Database', category: 'database', library: 'si', component: SiPostgresql, keywords: ['postgres', 'postgresql', 'elephant', 'sql', 'rdbms', 'acid'] },
  { name: 'SiMysql', label: 'MySQL Database', category: 'database', library: 'si', component: SiMysql, keywords: ['mysql', 'dolphin', 'sql', 'innodb', 'mariadb'] },
  { name: 'SiMariadb', label: 'MariaDB Server', category: 'database', library: 'si', component: SiMariadb, keywords: ['mariadb', 'mysql', 'galera', 'sql', 'open-source'] },
  { name: 'SiRedis', label: 'Redis In-Memory Cache', category: 'database', library: 'si', component: SiRedis, keywords: ['redis', 'cache', 'key-value', 'in-memory', 'pubsub'] },
  { name: 'SiMongodb', label: 'MongoDB NoSQL', category: 'database', library: 'si', component: SiMongodb, keywords: ['mongo', 'mongodb', 'leaf', 'document', 'nosql', 'bson'] },
  { name: 'SiSqlite', label: 'SQLite Embedded DB', category: 'database', library: 'si', component: SiSqlite, keywords: ['sqlite', 'embedded', 'file db', 'lite', 'sql'] },
  { name: 'SiApachecassandra', label: 'Apache Cassandra', category: 'database', library: 'si', component: SiApachecassandra, keywords: ['cassandra', 'nosql', 'distributed', 'columnar', 'big data'] },
  { name: 'SiApachekafka', label: 'Apache Kafka Streams', category: 'database', library: 'si', component: SiApachekafka, keywords: ['kafka', 'streaming', 'pubsub', 'event-driven', 'topics'] },
  { name: 'SiRabbitmq', label: 'RabbitMQ Message Broker', category: 'database', library: 'si', component: SiRabbitmq, keywords: ['rabbitmq', 'amqp', 'queues', 'broker', 'erlang'] },
  { name: 'SiMinio', label: 'MinIO High-Perf S3 Storage', category: 'database', library: 'si', component: SiMinio, keywords: ['minio', 's3', 'object storage', 'blob', 'bucket', 'selfhosted'] },
  { name: 'SiCeph', label: 'Ceph Distributed Storage', category: 'database', library: 'si', component: SiCeph, keywords: ['ceph', 'block storage', 'rgw', 'rbd', 'cluster'] },
  { name: 'FaDatabase', label: 'Database Cluster (FA6)', category: 'database', library: 'fa6', component: FaDatabase, keywords: ['database', 'sql', 'cluster', 'fa'] },
  { name: 'DiDatabase', label: 'Database Classic (DI)', category: 'database', library: 'di', component: DiDatabase, keywords: ['database', 'devicon', 'sql'] },

  // ==========================================
  // 🛡️ NETWORKING & SECURITY
  // ==========================================
  { name: 'SiWireguard', label: 'WireGuard VPN Protocol', category: 'network', library: 'si', component: SiWireguard, keywords: ['wireguard', 'vpn', 'crypto', 'tunnel', 'kernel', 'network'] },
  { name: 'SiOpenvpn', label: 'OpenVPN Security', category: 'network', library: 'si', component: SiOpenvpn, keywords: ['openvpn', 'vpn', 'tunnel', 'tls', 'security'] },
  { name: 'SiTailscale', label: 'Tailscale Mesh VPN', category: 'network', library: 'si', component: SiTailscale, keywords: ['tailscale', 'wireguard', 'mesh', 'p2p', 'zerotrust'] },
  { name: 'SiLetsencrypt', label: "Let's Encrypt Free SSL", category: 'network', library: 'si', component: SiLetsencrypt, keywords: ['letsencrypt', 'ssl', 'tls', 'certbot', 'acme', 'https'] },
  { name: 'SiTorproject', label: 'Tor Onion Routing', category: 'network', library: 'si', component: SiTorproject, keywords: ['tor', 'onion', 'privacy', 'anonymity', 'darkweb'] },
  { name: 'SiWireshark', label: 'Wireshark Packet Analysis', category: 'network', library: 'si', component: SiWireshark, keywords: ['wireshark', 'packet', 'pcap', 'sniffing', 'shark'] },
  { name: 'SiGnuprivacyguard', label: 'GnuPG / PGP Encryption', category: 'network', library: 'si', component: SiGnuprivacyguard, keywords: ['gpg', 'pgp', 'crypto', 'signing', 'keys', 'encryption'] },
  { name: 'SiCurl', label: 'cURL Command Line', category: 'network', library: 'si', component: SiCurl, keywords: ['curl', 'http', 'cli', 'network', 'request', 'rest'] },
  { name: 'FaEthernet', label: 'Ethernet RJ45 Cable (FA6)', category: 'network', library: 'fa6', component: FaEthernet, keywords: ['ethernet', 'cable', 'rj45', 'port', 'fa'] },
  { name: 'FaKey', label: 'SSH Auth Key (FA6)', category: 'network', library: 'fa6', component: FaKey, keywords: ['key', 'ssh', 'auth', 'private key', 'fa'] },
  { name: 'FaLock', label: 'SSL TLS Lock (FA6)', category: 'network', library: 'fa6', component: FaLock, keywords: ['lock', 'security', 'ssl', 'crypto', 'fa'] },
  { name: 'FaShieldHalved', label: 'Security Firewall Shield (FA6)', category: 'network', library: 'fa6', component: FaShieldHalved, keywords: ['shield', 'security', 'firewall', 'protection', 'fa'] },

  // ==========================================
  // 💻 CODE & DEV (Expanded with Lucide)
  // ==========================================
  { name: 'Terminal', label: 'Terminal CLI (Lucide)', category: 'code', library: 'lucide', component: Terminal, keywords: ['terminal', 'bash', 'console', 'shell'] },
  { name: 'Cpu', label: 'CPU Processor', category: 'code', library: 'lucide', component: Cpu, keywords: ['hardware', 'chip', 'processor', 'compute'] },
  { name: 'Binary', label: 'Binary Data Stream', category: 'code', library: 'lucide', component: Binary, keywords: ['bits', 'data', 'low-level', 'assembly'] },
  { name: 'GitBranch', label: 'Git Branch', category: 'code', library: 'lucide', component: GitBranch, keywords: ['branch', 'git', 'feature', 'version'] },
  { name: 'GitCommit', label: 'Git Commit', category: 'code', library: 'lucide', component: GitCommit, keywords: ['commit', 'log', 'history'] },
  { name: 'GitPullRequest', label: 'Pull Request', category: 'code', library: 'lucide', component: GitPullRequest, keywords: ['pr', 'review', 'merge'] },
  { name: 'Workflow', label: 'Workflow Pipeline', category: 'code', library: 'lucide', component: Workflow, keywords: ['pipeline', 'automation', 'graph', 'process'] },
  { name: 'Braces', label: 'Code Braces', category: 'code', library: 'lucide', component: Braces, keywords: ['json', 'brackets', 'syntax'] },
  { name: 'Bug', label: 'Bug & Debugger', category: 'code', library: 'lucide', component: Bug, keywords: ['issue', 'error', 'debug'] },
  { name: 'Shield', label: 'Security Shield', category: 'code', library: 'lucide', component: Shield, keywords: ['security', 'firewall', 'protection'] },
  { name: 'Key', label: 'API & Auth Key', category: 'code', library: 'lucide', component: Key, keywords: ['api', 'token', 'secret', 'password'] },
  { name: 'Lock', label: 'Encrypted Lock', category: 'code', library: 'lucide', component: Lock, keywords: ['crypto', 'private', 'secure'] },
  { name: 'Bot', label: 'AI Agent Bot', category: 'code', library: 'lucide', component: Bot, keywords: ['robot', 'agent', 'automation', 'gemini', 'ai'] },
  { name: 'Wifi', label: 'Wireless Network', category: 'code', library: 'lucide', component: Wifi, keywords: ['connection', 'p2p', 'online', 'wlan'] },
  { name: 'Laptop', label: 'Laptop Workstation', category: 'code', library: 'lucide', component: Laptop, keywords: ['computer', 'laptop', 'workstation', 'device'] },

  // ==========================================
  // 📁 DIRECTORIES & FOLDERS
  // ==========================================
  { name: 'Folder', label: 'Directory Folder', category: 'folders', library: 'lucide', component: Folder, keywords: ['dir', 'directory', 'folder', 'storage'] },
  { name: 'FolderOpen', label: 'Folder Open', category: 'folders', library: 'lucide', component: FolderOpen, keywords: ['open', 'expand', 'directory'] },
  { name: 'FolderArchive', label: 'Folder Archive', category: 'folders', library: 'lucide', component: FolderArchive, keywords: ['archive', 'backup', 'vault'] },
  { name: 'FolderGit2', label: 'Folder Git Repo', category: 'folders', library: 'lucide', component: FolderGit2, keywords: ['git', 'repo', 'version'] },
  { name: 'FolderTree', label: 'Folder Hierarchy Tree', category: 'folders', library: 'lucide', component: FolderTree, keywords: ['tree', 'structure', 'hierarchy'] },
  { name: 'FolderCode', label: 'Folder Source Code', category: 'folders', library: 'lucide', component: FolderCode, keywords: ['code', 'source', 'dev', 'src'] },
  { name: 'FolderHeart', label: 'Folder Starred', category: 'folders', library: 'lucide', component: FolderHeart, keywords: ['favorite', 'love', 'starred'] },
  { name: 'FolderKanban', label: 'Folder Kanban Project', category: 'folders', library: 'lucide', component: FolderKanban, keywords: ['kanban', 'tasks', 'board'] },
  { name: 'FolderKey', label: 'Folder Key Vault', category: 'folders', library: 'lucide', component: FolderKey, keywords: ['security', 'key', 'auth'] },
  { name: 'FolderLock', label: 'Folder Encrypted', category: 'folders', library: 'lucide', component: FolderLock, keywords: ['locked', 'private', 'secret'] },
  { name: 'FolderRoot', label: 'Folder Root System', category: 'folders', library: 'lucide', component: FolderRoot, keywords: ['root', 'base', 'system', 'slash'] },
  { name: 'FolderSync', label: 'Folder Cloud Sync', category: 'folders', library: 'lucide', component: FolderSync, keywords: ['sync', 'cloud', 'refresh'] },
  { name: 'FolderSearch', label: 'Folder Search Query', category: 'folders', library: 'lucide', component: FolderSearch, keywords: ['find', 'search', 'query'] },
  { name: 'FolderClock', label: 'Folder History Time', category: 'folders', library: 'lucide', component: FolderClock, keywords: ['history', 'time', 'recent'] },
  { name: 'FolderCheck', label: 'Folder Verified Done', category: 'folders', library: 'lucide', component: FolderCheck, keywords: ['completed', 'verified', 'approved'] },
  { name: 'Archive', label: 'Archive Zip Box', category: 'folders', library: 'lucide', component: Archive, keywords: ['archive', 'zip', 'tar', 'storage'] },
  { name: 'Package', label: 'Package Bundle', category: 'folders', library: 'lucide', component: Package, keywords: ['npm', 'package', 'bundle', 'box'] },
  { name: 'Boxes', label: 'Boxes Modules', category: 'folders', library: 'lucide', component: Boxes, keywords: ['modules', 'components', 'containers'] },
  { name: 'Layers', label: 'Layers Stack', category: 'folders', library: 'lucide', component: Layers, keywords: ['architecture', 'stack', 'strata'] },
  { name: 'Database', label: 'Database Storage', category: 'folders', library: 'lucide', component: Database, keywords: ['sql', 'data', 'storage', 'records'] },
  { name: 'Server', label: 'Server Host Rack', category: 'folders', library: 'lucide', component: Server, keywords: ['host', 'backend', 'node', 'rack'] },
  { name: 'HardDrive', label: 'Hard Disk Storage', category: 'folders', library: 'lucide', component: HardDrive, keywords: ['disk', 'storage', 'backup', 'ssd'] },
  { name: 'Inbox', label: 'Inbox Quick Capture', category: 'folders', library: 'lucide', component: Inbox, keywords: ['incoming', 'capture', 'new'] },
  { name: 'Briefcase', label: 'Work Briefcase', category: 'folders', library: 'lucide', component: Briefcase, keywords: ['work', 'job', 'business'] },

  // ==========================================
  // 📝 NOTES & DOCUMENTS
  // ==========================================
  { name: 'FileText', label: 'Markdown Text Note', category: 'docs', library: 'lucide', component: FileText, keywords: ['note', 'document', 'text', 'draft', 'md'] },
  { name: 'FileCode', label: 'Code File Script', category: 'docs', library: 'lucide', component: FileCode, keywords: ['code', 'markup', 'mf', 'dev', 'ts', 'js'] },
  { name: 'BookOpen', label: 'Book Manual', category: 'docs', library: 'lucide', component: BookOpen, keywords: ['reading', 'study', 'manual', 'learn'] },
  { name: 'Notebook', label: 'Spiral Notebook', category: 'docs', library: 'lucide', component: Notebook, keywords: ['journal', 'notes', 'diary'] },
  { name: 'BookMarked', label: 'Bookmarked Handbook', category: 'docs', library: 'lucide', component: BookMarked, keywords: ['saved', 'reference', 'handbook'] },
  { name: 'Scroll', label: 'Historic Scroll', category: 'docs', library: 'lucide', component: Scroll, keywords: ['parchment', 'history', 'manifesto'] },
  { name: 'PenTool', label: 'Pen Tool Vector', category: 'docs', library: 'lucide', component: PenTool, keywords: ['writing', 'design', 'vector'] },
  { name: 'Feather', label: 'Feather Quill', category: 'docs', library: 'lucide', component: Feather, keywords: ['writing', 'essay', 'poetry'] },
  { name: 'Newspaper', label: 'News Feed', category: 'docs', library: 'lucide', component: Newspaper, keywords: ['news', 'feed', 'articles', 'changelog'] },
  { name: 'GraduationCap', label: 'Academic Thesis', category: 'docs', library: 'lucide', component: GraduationCap, keywords: ['school', 'university', 'research', 'thesis'] },
  { name: 'Quote', label: 'Citation Quote', category: 'docs', library: 'lucide', component: Quote, keywords: ['citation', 'quote', 'excerpt'] },
  { name: 'Library', label: 'PKM Library', category: 'docs', library: 'lucide', component: Library, keywords: ['books', 'archive', 'pkm'] },
  { name: 'StickyNote', label: 'Sticky Scratchpad', category: 'docs', library: 'lucide', component: StickyNote, keywords: ['memo', 'scratchpad', 'quick'] },
  { name: 'FileCheck', label: 'Verified Document', category: 'docs', library: 'lucide', component: FileCheck, keywords: ['reviewed', 'passed', 'tested'] },
  { name: 'FileSpreadsheet', label: 'Spreadsheet Matrix', category: 'docs', library: 'lucide', component: FileSpreadsheet, keywords: ['sheets', 'calc', 'matrix', 'csv'] },
  { name: 'FileQuestion', label: 'Unsolved Inquiry', category: 'docs', library: 'lucide', component: FileQuestion, keywords: ['question', 'draft', 'inquiry', 'todo'] },

  // ==========================================
  // 🧠 MIND, SCIENCE & IDEAS
  // ==========================================
  { name: 'Brain', label: 'Brain Knowledge Node', category: 'ideas', library: 'lucide', component: Brain, keywords: ['mind', 'neuro', 'thinking', 'pkm', 'concept'] },
  { name: 'Lightbulb', label: 'Eureka Lightbulb', category: 'ideas', library: 'lucide', component: Lightbulb, keywords: ['eureka', 'invention', 'concept', 'idea'] },
  { name: 'Sparkles', label: 'AI Sparkles & Insight', category: 'ideas', library: 'lucide', component: Sparkles, keywords: ['magic', 'ai', 'gemini', 'creativity'] },
  { name: 'Atom', label: 'Quantum Atom', category: 'ideas', library: 'lucide', component: Atom, keywords: ['quantum', 'nuclear', 'science', 'physics'] },
  { name: 'FlaskConical', label: 'Lab Experiment', category: 'ideas', library: 'lucide', component: FlaskConical, keywords: ['chemistry', 'hypothesis', 'test'] },
  { name: 'Telescope', label: 'Telescope Horizon', category: 'ideas', library: 'lucide', component: Telescope, keywords: ['astronomy', 'horizon', 'vision', 'future'] },
  { name: 'Zap', label: 'High Energy Zap', category: 'ideas', library: 'lucide', component: Zap, keywords: ['lightning', 'fast', 'power', 'surge'] },
  { name: 'Flame', label: 'Streak Flame', category: 'ideas', library: 'lucide', component: Flame, keywords: ['hot', 'trend', 'streak', 'fire'] },
  { name: 'Rocket', label: 'Rocket Launch', category: 'ideas', library: 'lucide', component: Rocket, keywords: ['startup', 'launch', 'release', 'deploy'] },
  { name: 'Target', label: 'Target Objective', category: 'ideas', library: 'lucide', component: Target, keywords: ['goal', 'okr', 'aim', 'focus'] },
  { name: 'Infinity', label: 'Infinity Loop', category: 'ideas', library: 'lucide', component: InfinityIcon, keywords: ['loop', 'limitless', 'math', 'evergreen'] },
  { name: 'Activity', label: 'Activity Telemetry', category: 'ideas', library: 'lucide', component: Activity, keywords: ['health', 'pulse', 'telemetry', 'heartbeat'] },
  { name: 'Microscope', label: 'Deep Dive Microscope', category: 'ideas', library: 'lucide', component: Microscope, keywords: ['detail', 'biology', 'deep-dive'] },
  { name: 'Dna', label: 'DNA Helix Core', category: 'ideas', library: 'lucide', component: Dna, keywords: ['genetics', 'life', 'core'] },

  // ==========================================
  // 📅 ORGANIZATION & PRODUCTIVITY
  // ==========================================
  { name: 'Calendar', label: 'Calendar Planner', category: 'organize', library: 'lucide', component: Calendar, keywords: ['date', 'schedule', 'planner', 'agenda'] },
  { name: 'CheckSquare', label: 'Task Check Square', category: 'organize', library: 'lucide', component: CheckSquare, keywords: ['done', 'todo', 'task', 'checklist'] },
  { name: 'ListTodo', label: 'Backlog Task List', category: 'organize', library: 'lucide', component: ListTodo, keywords: ['backlog', 'todo', 'tasks'] },
  { name: 'Clock', label: 'Clock Timestamp', category: 'organize', library: 'lucide', component: Clock, keywords: ['timestamp', 'duration', 'timer'] },
  { name: 'Timer', label: 'Pomodoro Timer', category: 'organize', library: 'lucide', component: Timer, keywords: ['pomodoro', 'sprint', 'stopwatch'] },
  { name: 'Flag', label: 'Priority Flag', category: 'organize', library: 'lucide', component: Flag, keywords: ['priority', 'milestone', 'marker'] },
  { name: 'Pin', label: 'Pinned Pushpin', category: 'organize', library: 'lucide', component: Pin, keywords: ['pinned', 'important', 'favorite'] },
  { name: 'MapPin', label: 'Location Pin', category: 'organize', library: 'lucide', component: MapPin, keywords: ['place', 'geo', 'address'] },
  { name: 'Compass', label: 'Navigation Compass', category: 'organize', library: 'lucide', component: Compass, keywords: ['direction', 'explore', 'guide'] },
  { name: 'PieChart', label: 'Metrics Pie Chart', category: 'organize', library: 'lucide', component: PieChart, keywords: ['analytics', 'metrics', 'stats'] },
  { name: 'TrendingUp', label: 'Growth Trending Up', category: 'organize', library: 'lucide', component: TrendingUp, keywords: ['growth', 'progress', 'finance', 'roi'] },

  // ==========================================
  // ✨ SYMBOLS & MEDIA
  // ==========================================
  { name: 'Image', label: 'Image Asset', category: 'symbols', library: 'lucide', component: Image, keywords: ['photo', 'graphic', 'art'] },
  { name: 'Music', label: 'Audio Music Track', category: 'symbols', library: 'lucide', component: Music, keywords: ['audio', 'sound', 'song'] },
  { name: 'Video', label: 'Video Footage', category: 'symbols', library: 'lucide', component: Video, keywords: ['movie', 'media', 'stream'] },
  { name: 'Headphones', label: 'Headphones Audio', category: 'symbols', library: 'lucide', component: Headphones, keywords: ['listen', 'podcast', 'audio', 'voice'] },
  { name: 'Camera', label: 'Snapshot Camera', category: 'symbols', library: 'lucide', component: Camera, keywords: ['photo', 'snapshot', 'lens'] },
  { name: 'Palette', label: 'Palette Colors', category: 'symbols', library: 'lucide', component: Palette, keywords: ['theme', 'color', 'paint', 'ui'] },
  { name: 'Heart', label: 'Heart Favorite', category: 'symbols', library: 'lucide', component: Heart, keywords: ['love', 'like', 'health'] },
  { name: 'Star', label: 'Gold Star', category: 'symbols', library: 'lucide', component: Star, keywords: ['favorite', 'rating', 'starred'] },
  { name: 'Award', label: 'Achievement Badge', category: 'symbols', library: 'lucide', component: Award, keywords: ['badge', 'medal', 'achievement'] },
  { name: 'Crown', label: 'VIP Crown', category: 'symbols', library: 'lucide', component: Crown, keywords: ['leader', 'top', 'vip'] },
  { name: 'Sun', label: 'Daylight Sun', category: 'symbols', library: 'lucide', component: Sun, keywords: ['day', 'light', 'bright'] },
  { name: 'Moon', label: 'Dark Mode Moon', category: 'symbols', library: 'lucide', component: Moon, keywords: ['night', 'dark', 'sleep'] },
  { name: 'Coffee', label: 'Coffee Cup', category: 'symbols', library: 'lucide', component: Coffee, keywords: ['break', 'cafe', 'morning'] },
  { name: 'Gem', label: 'Diamond Gem', category: 'symbols', library: 'lucide', component: Gem, keywords: ['crystal', 'valuable', 'rare'] },
  { name: 'Eye', label: 'Vision Eye', category: 'symbols', library: 'lucide', component: Eye, keywords: ['view', 'vision', 'observe'] },
  { name: 'Globe', label: 'Earth Globe Web', category: 'symbols', library: 'lucide', component: Globe, keywords: ['world', 'international', 'web', 'internet'] },
];

// Fast lookup map for all icon names (case-insensitive)
export const ICON_MAP = new Map<string, IconDefinition>();

// Register all primary icon names
for (const item of ICON_LIBRARY) {
  ICON_MAP.set(item.name.toLowerCase(), item);
}

// Common aliases for seamless shorthand matching
const ALIASES: Record<string, string> = {
  // Linux aliases
  linux: 'SiLinux',
  tux: 'SiLinux',
  ubuntu: 'SiUbuntu',
  debian: 'SiDebian',
  arch: 'SiArchlinux',
  archlinux: 'SiArchlinux',
  fedora: 'SiFedora',
  redhat: 'SiRedhat',
  rhel: 'SiRedhat',
  centos: 'SiCentos',
  alpine: 'SiAlpinelinux',
  kali: 'SiKalilinux',
  suse: 'SiOpensuse',
  opensuse: 'SiOpensuse',
  gentoo: 'SiGentoo',
  nixos: 'SiNixos',
  rocky: 'SiRockylinux',
  alma: 'SiAlmalinux',
  mint: 'SiLinuxmint',
  bsd: 'SiFreebsd',
  freebsd: 'SiFreebsd',
  rpi: 'SiRaspberrypi',
  raspberry: 'SiRaspberrypi',
  bash: 'SiGnubash',
  zsh: 'SiZsh',
  gnu: 'SiGnu',
  // Sysadmin aliases
  docker: 'SiDocker',
  k8s: 'SiKubernetes',
  kubernetes: 'SiKubernetes',
  podman: 'SiPodman',
  ansible: 'SiAnsible',
  terraform: 'SiTerraform',
  helm: 'SiHelm',
  puppet: 'SiPuppet',
  nginx: 'SiNginx',
  apache: 'SiApache',
  caddy: 'SiCaddy',
  traefik: 'SiTraefikproxy',
  tmux: 'SiTmux',
  vim: 'SiVim',
  nvim: 'SiNeovim',
  neovim: 'SiNeovim',
  prometheus: 'SiPrometheus',
  grafana: 'SiGrafana',
  datadog: 'SiDatadog',
  elastic: 'SiElasticsearch',
  elasticsearch: 'SiElasticsearch',
  logstash: 'SiLogstash',
  kibana: 'SiKibana',
  gitlab: 'SiGitlab',
  jenkins: 'SiJenkins',
  argo: 'SiArgo',
  vault: 'SiVault',
  consul: 'SiConsul',
  portainer: 'SiPortainer',
  // Cloud aliases
  aws: 'FaAws',
  gcp: 'SiGooglecloud',
  googlecloud: 'SiGooglecloud',
  azure: 'VscAzure',
  azuredevops: 'VscAzureDevops',
  cloudflare: 'SiCloudflare',
  digitalocean: 'SiDigitalocean',
  hetzner: 'SiHetzner',
  vultr: 'SiVultr',
  openstack: 'SiOpenstack',
  vercel: 'SiVercel',
  netlify: 'SiNetlify',
  supabase: 'SiSupabase',
  firebase: 'SiFirebase',
  fastly: 'SiFastly',
  flyio: 'SiFlydotio',
  render: 'SiRender',
  railway: 'SiRailway',
  scaleway: 'SiScaleway',
  linode: 'SiAkamai',
  // DB & Storage aliases
  postgres: 'SiPostgresql',
  postgresql: 'SiPostgresql',
  mysql: 'SiMysql',
  mariadb: 'SiMariadb',
  redis: 'SiRedis',
  mongo: 'SiMongodb',
  mongodb: 'SiMongodb',
  sqlite: 'SiSqlite',
  cassandra: 'SiApachecassandra',
  kafka: 'SiApachekafka',
  rabbitmq: 'SiRabbitmq',
  minio: 'SiMinio',
  ceph: 'SiCeph',
  // Network & Security aliases
  wireguard: 'SiWireguard',
  openvpn: 'SiOpenvpn',
  tailscale: 'SiTailscale',
  letsencrypt: 'SiLetsencrypt',
  tor: 'SiTorproject',
  wireshark: 'SiWireshark',
  gpg: 'SiGnuprivacyguard',
  curl: 'SiCurl',
  ssh: 'FaKey',
  firewall: 'FaShieldHalved',
};

for (const [alias, targetName] of Object.entries(ALIASES)) {
  const targetDef = ICON_MAP.get(targetName.toLowerCase());
  if (targetDef && !ICON_MAP.has(alias.toLowerCase())) {
    ICON_MAP.set(alias.toLowerCase(), targetDef);
  }
}

export const PRESET_ICON_COLORS: { label: string; hex: string }[] = [
  { label: 'Cyber Pink', hex: '#ec4899' },
  { label: 'Purple Glow', hex: '#c084fc' },
  { label: 'Electric Violet', hex: '#8b5cf6' },
  { label: 'Sky Cyan', hex: '#06b6d4' },
  { label: 'Matrix Green', hex: '#10b981' },
  { label: 'Amber Gold', hex: '#f59e0b' },
  { label: 'Sunset Orange', hex: '#f97316' },
  { label: 'Coral Rose', hex: '#f43f5e' },
  { label: 'Neon Lime', hex: '#84cc16' },
  { label: 'Electric Blue', hex: '#3b82f6' },
  { label: 'Clean Slate', hex: '#94a3b8' },
  { label: 'Pure Pearl', hex: '#faf5ff' },
];

export function getIconDefinition(iconName?: string | null): IconDefinition | undefined {
  if (!iconName) return undefined;
  return ICON_MAP.get(iconName.toLowerCase());
}

/**
 * Checks if a string contains SVG markup (even with XML declarations)
 */
export function isSvgMarkup(str?: string | null): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  return (trimmed.startsWith('<svg') || trimmed.includes('<svg')) && trimmed.includes('</svg>');
}

/**
 * Ensures an SVG color is always high-contrast and noticeably different from dark backgrounds
 */
export function ensureContrastingColor(color?: string | null, fallback = '#faf5ff'): string {
  if (!color || !color.trim()) return fallback;
  const c = color.trim().toLowerCase();
  // Check known dark background hexes & keywords that blend into canvas
  if (
    c === '#000' ||
    c === '#000000' ||
    c === 'black' ||
    c === '#0c0714' ||
    c === '#150d24' ||
    c === '#1f1338' ||
    c === '#111827' ||
    c === '#18181b' ||
    c === '#0f172a' ||
    c === '#2e1c52' ||
    c === '#19102b' ||
    c === '#121216' ||
    c === '#09090b'
  ) {
    return fallback;
  }

  // If 6-character hex, check perceived luminance to ensure readability against dark backgrounds
  const hexMatch = c.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    const r = parseInt(hexMatch[1], 16);
    const g = parseInt(hexMatch[2], 16);
    const b = parseInt(hexMatch[3], 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (luminance < 0.22) {
      return fallback;
    }
  }

  return color;
}

/**
 * Sanitizes and normalizes an uploaded or pasted SVG string for safe rendering.
 * Normalizes dark/black fills and strokes to currentColor so the SVG always has a distinct, contrasting color from the background.
 */
export function sanitizeSvgString(svg: string, _resolvedColor?: string): string {
  if (!svg) return '';

  // 1. Remove XML declarations, DOCTYPEs, and comments
  let cleaned = svg
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/gi, '')
    .trim();

  // 2. Extract <svg ... </svg> root element
  const svgMatch = cleaned.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) {
    cleaned = svgMatch[0];
  }

  // 3. Strip harmful script tags and event handlers
  cleaned = cleaned
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:\s*text\/html/gi, '');

  // 4. Ensure viewBox is present; synthesize from width/height if missing
  const hasViewBox = /viewBox\s*=/i.test(cleaned);
  if (!hasViewBox) {
    const widthMatch = cleaned.match(/\bwidth\s*=\s*["']?(\d+(?:\.\d+)?)(?:px)?["']?/i);
    const heightMatch = cleaned.match(/\bheight\s*=\s*["']?(\d+(?:\.\d+)?)(?:px)?["']?/i);
    if (widthMatch && heightMatch) {
      const w = widthMatch[1];
      const h = heightMatch[1];
      cleaned = cleaned.replace(/<svg\b/i, `<svg viewBox="0 0 ${w} ${h}" `);
    }
  }

  // 5. Replace fixed width/height on the root <svg> tag so it scales fluidly in UI
  cleaned = cleaned.replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
    const newAttrs = attrs
      .replace(/\bwidth\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\bheight\s*=\s*["'][^"']*["']/gi, '');
    return `<svg ${newAttrs} width="100%" height="100%">`;
  });

  // 6. Normalization: ensure SVG color is DIFFERENT from dark background
  // Replace black/dark fills that match the background with currentColor
  cleaned = cleaned.replace(
    /\bfill\s*=\s*["'](?:#000(?:000)?|black|#0c0714|#150d24|#1f1338|#111827|#18181b|#0f172a|#2e1c52|rgb\(0,\s*0,\s*0\))["']/gi,
    'fill="currentColor"'
  );

  // Replace black/dark strokes that match the background with currentColor
  cleaned = cleaned.replace(
    /\bstroke\s*=\s*["'](?:#000(?:000)?|black|#0c0714|#150d24|#1f1338|#111827|#18181b|#0f172a|#2e1c52|rgb\(0,\s*0,\s*0\))["']/gi,
    'stroke="currentColor"'
  );

  // Replace inline styles with black/dark fills
  cleaned = cleaned.replace(
    /fill\s*:\s*(?:#000(?:000)?|black|#0c0714|#150d24|#1f1338|rgb\(0,\s*0,\s*0\))/gi,
    'fill: currentColor'
  );
  cleaned = cleaned.replace(
    /stroke\s*:\s*(?:#000(?:000)?|black|#0c0714|#150d24|#1f1338|rgb\(0,\s*0,\s*0\))/gi,
    'stroke: currentColor'
  );

  // If the SVG does not specify fill or stroke anywhere, add fill="currentColor" to the root <svg>
  if (!/\bfill\s*=/i.test(cleaned) && !/\bstroke\s*=/i.test(cleaned)) {
    cleaned = cleaned.replace(/<svg\b/i, '<svg fill="currentColor" ');
  }

  return cleaned;
}

interface CustomIconProps {
  iconName?: string | null;
  className?: string;
  color?: string | null;
  defaultIcon?: React.ComponentType<{ className?: string; style?: React.CSSProperties; size?: string | number }>;
  fallbackIcon?: React.ComponentType<{ className?: string; style?: React.CSSProperties; size?: string | number }>;
  style?: React.CSSProperties;
}

/**
 * Renders either a registered icon from any library, raw custom SVG markup, or a fallback icon.
 * Guarantees that SVG color is distinct and clearly contrasting from the background.
 */
export const CustomIconRenderer: React.FC<CustomIconProps> = ({
  iconName,
  className = 'w-4 h-4',
  color,
  defaultIcon: DefaultIcon = Folder,
  fallbackIcon,
  style = {},
}) => {
  const fallbackColor = DefaultIcon === Folder || DefaultIcon === FolderOpen ? '#ec4899' : '#faf5ff';
  const resolvedColor = ensureContrastingColor(color, fallbackColor);

  const mergedStyle: React.CSSProperties = {
    ...style,
    color: resolvedColor,
  };

  // Case 1: Custom inline SVG snippet (starts with <svg or contains <svg>...</svg>)
  if (iconName && isSvgMarkup(iconName)) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:transition-colors ${className}`}
        style={mergedStyle}
        dangerouslySetInnerHTML={{
          __html: sanitizeSvgString(iconName, resolvedColor),
        }}
      />
    );
  }

  // Case 2: Named Icon from library (Simple Icons, Font Awesome 6, VS Code, Devicons, Lucide)
  if (iconName) {
    const def = getIconDefinition(iconName);
    if (def) {
      const Component = def.component;
      return <Component className={`shrink-0 ${className}`} style={mergedStyle} />;
    }
  }

  // Case 3: Fallback / Default
  const Fallback = fallbackIcon || DefaultIcon;
  return <Fallback className={`shrink-0 ${className}`} style={mergedStyle} />;
};
