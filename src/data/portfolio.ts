export interface Identity {
  name: string;
  role: string;
  role_vi?: string;
  node: string;
  ip: string;
  location: string;
  location_vi?: string;
  email: string;
  phone?: string;
  linkedin: {
    handle: string;
    url: string;
  };
  github: {
    handle: string;
    url: string;
  };
  youtube?: {
    handle: string;
    url: string;
  };
  bio: string;
  bio_vi?: string;
  /** Avatar image (data URL or path). Optional. */
  avatar?: string;
  /** Optional CV / Resume PDF URL or uploaded file URL. */
  cvUrl?: string;
  /** Open to Work availability status. When true and cvUrl is available, public CV action is shown. */
  openToWork?: boolean;
  /** Active theme layout: 'ascii' (Forkfolio ASCII Art) | 'knight' (Forkfolio Minimalist) | 'editorial' (DevOps 3D) | 'forkfolio' (Modern Mono) */
  themeVariant?: 'forkfolio' | 'editorial' | 'ascii' | 'knight';
}

export interface CareerSettings {
  openToWork: boolean;
  cvUrl?: string;
}

export function getCareerSettings(data?: Partial<PortfolioData> | null): CareerSettings {
  const openToWork = data?.careerSettings?.openToWork ?? data?.identity?.openToWork ?? true;
  const rawCv = data?.careerSettings?.cvUrl ?? data?.identity?.cvUrl;
  const cvUrl = typeof rawCv === 'string' && rawCv.trim().length > 0 ? rawCv.trim() : undefined;
  return {
    openToWork: Boolean(openToWork),
    cvUrl,
  };
}

export interface AppearanceConfig {
  activeTheme: 'ascii' | 'knight' | 'editorial' | 'forkfolio';
  colorMode?: 'light' | 'dark' | 'system';
}

export interface Skill {
  id: string;
  tag: string;
  name: string;
  category?: string;
  category_vi?: string;
  status: 'ACTIVE' | 'SYNCING';
  delay?: string;
}

export interface Certification {
  id: string;
  name: string;
  name_vi?: string;
  issuer: string;
  issuer_vi?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  badge?: string;
  description?: string;
  description_vi?: string;
  color?: 'yellow' | 'blue';
  delay?: string;
  order?: number;
}

export interface ExperienceItem {
  id: string;
  role: string;
  role_vi?: string;
  company: string;
  period: string;
  period_vi?: string;
  isCurrent: boolean;
  bullets: string[];
  bullets_vi?: string[];
  tags: string[];
}

export interface EducationItem {
  id: string;
  badge: string;
  period: string;
  period_vi?: string;
  degree: string;
  degree_vi?: string;
  school: string;
  school_vi?: string;
  description: string;
  description_vi?: string;
}

export interface ProjectMedia {
  /** Image or GIF (public URL or data URL) */
  src: string;
  caption?: string;
}

export interface Project {
  id: string;
  title: string;
  title_vi?: string;
  shortDesc: string;
  shortDesc_vi?: string;
  description: string;
  description_vi?: string;
  tags: string[];
  link: string;
  color: 'emerald' | 'blue' | 'purple' | 'orange';
  status: 'ONLINE' | 'MAINTENANCE';
  /** Screenshots / GIFs shown in the project detail modal */
  media?: ProjectMedia[];
}

export interface APMSpan {
  name: string;
  duration: string;
  leftPercent: number;
  widthPercent: number;
  color: 'emerald' | 'blue' | 'purple' | 'orange';
  delay: string;
}

export interface Telemetry {
  uptimeSLA: string;
  initialReqCount: number;
  traceId: string;
  traceLatency: string;
  spans: APMSpan[];
}

export interface GalleryDetail {
  label: string;
  value: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  /** Image as data URL or path */
  image: string;
  date?: string;
  location?: string;
  tags: string[];
  details: GalleryDetail[];
}

export interface PortfolioData {
  identity: Identity;
  skills: Skill[];
  certifications: Certification[];
  experience: ExperienceItem[];
  education?: EducationItem[];
  projects: Project[];
  telemetry: Telemetry;
  gallery: GalleryItem[];
  appearance?: AppearanceConfig;
  careerSettings?: CareerSettings;
}

export const defaultPortfolioData: PortfolioData = {
  identity: {
    name: 'Nguyễn Thanh Quân',
    role: 'DevOps Engineer',
    role_vi: 'Kỹ sư DevOps',
    avatar: 'https://ywjdrrmdnkdydeqprcib.supabase.co/storage/v1/object/public/portfolio/avatar/mw95dpo2-xvsbsl.jpg',
    node: 'HCM-VNM-01',
    ip: '192.168.1.104',
    location: 'Ho Chi Minh, VN',
    location_vi: 'TP. Hồ Chí Minh, VN',
    email: 'quannguyenthanh558@gmail.com',
    phone: '+84 832 010 601',
    linkedin: {
      handle: 'in/quanblue',
      url: 'https://linkedin.com/in/quanblue',
    },
    github: {
      handle: '@QuanBlue',
      url: 'https://github.com/QuanBlue',
    },
    youtube: {
      handle: '@quanblueee',
      url: 'https://www.youtube.com/@quanblueee',
    },
    cvUrl: '/cv.pdf',
    openToWork: true,
    themeVariant: 'ascii',
    bio: 'Solid foundation in Linux and Networking, and enthusiasm for setting up, managing, and protecting network systems. Desire to learn more and keep up with up-to-date technologies. Ability to adapt to the working environment quickly and flexibly.',
    bio_vi: 'Nền tảng vững chắc về Linux và Mạng máy tính, đam mê thiết lập, quản trị và bảo vệ hệ thống mạng phân tán. Luôn khao khát học hỏi và cập nhật các công nghệ mới, thích ứng nhanh và linh hoạt với môi trường làm việc.',
  },
  skills: [
    { id: 'k8s', tag: '[k8s-core]', category: 'Cloud & Infrastructure', category_vi: 'Điện toán đám mây & Hạ tầng', name: 'Kubernetes', status: 'ACTIVE', delay: '0s' },
    { id: 'docker', tag: '[containerd]', category: 'Cloud & Infrastructure', category_vi: 'Điện toán đám mây & Hạ tầng', name: 'Docker', status: 'ACTIVE', delay: '0.2s' },
    { id: 'ansible', tag: '[cfg-mgmt]', category: 'CI/CD & Automation', category_vi: 'CI/CD & Tự động hóa', name: 'Ansible', status: 'ACTIVE', delay: '0.5s' },
    { id: 'prometheus', tag: '[metrics-db]', category: 'Observability & Monitoring', category_vi: 'Giám sát & Độ tin cậy (SRE)', name: 'Prometheus', status: 'ACTIVE', delay: '0.1s' },
    { id: 'linux', tag: '[sys-kernel]', category: 'Linux & Networking', category_vi: 'Linux & Mạng máy tính', name: 'Linux/Ubuntu', status: 'ACTIVE', delay: '0.7s' },
    { id: 'haproxy', tag: '[l4-proxy]', category: 'Linux & Networking', category_vi: 'Linux & Mạng máy tính', name: 'HAProxy', status: 'ACTIVE', delay: '0.4s' },
    { id: 'istio', tag: '[svc-mesh]', category: 'Cloud & Infrastructure', category_vi: 'Điện toán đám mây & Hạ tầng', name: 'Istio', status: 'SYNCING', delay: '0.3s' },
  ],
  certifications: [
    {
      id: 'cka',
      name: 'CKA: Certified K8s Admin',
      name_vi: 'CKA: Quản trị viên Kubernetes Chuyên nghiệp',
      issuer: 'Cloud Native Computing Foundation',
      issueDate: '2024',
      badge: 'CKA',
      credentialId: 'LF-cka-2024-9182',
      credentialUrl: 'https://www.cncf.io/certification/cka/',
      description: 'Validates skills in Kubernetes cluster architecture, installation, configuration, networking, and troubleshooting in multi-node environments.',
      description_vi: 'Chứng thực kỹ năng chuyên sâu về kiến trúc, triển khai, mạng và xử lý sự cố cụm Kubernetes trong môi trường đa node.',
      color: 'yellow',
      delay: '0s',
    },
    {
      id: 'aws-sa',
      name: 'AWS Solutions Architect',
      name_vi: 'AWS Solutions Architect (Associate)',
      issuer: 'Amazon Web Services',
      issueDate: '2023',
      badge: 'AWS-SAA',
      credentialId: 'AWS-SAA-839120',
      credentialUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/',
      description: 'Validates ability to design and implement distributed, secure, highly available, and cost-optimized systems on AWS.',
      description_vi: 'Chứng thực năng lực thiết kế và triển khai các hệ thống phân tán an toàn, sẵn sàng cao và tối ưu chi phí trên nền tảng AWS.',
      color: 'blue',
      delay: '0.5s',
    },
  ],
  experience: [
    {
      id: 'viettel-devops',
      role: 'DevOps Engineer',
      role_vi: 'Kỹ sư DevOps',
      company: 'Viettel',
      period: '07/2025 ─ Present',
      period_vi: '07/2025 ─ Hiện tại',
      isCurrent: true,
      bullets: [
        'Manage infrastructure sizing, security hardening and DB optimization for Viettel DMS SaaS platform on multi-zone network architecture.',
        'Technical training for interns, building specialized curriculum on Service Mesh, Canary deployments, and Kubernetes.',
      ],
      bullets_vi: [
        'Quản lý infrastructure sizing, tăng cường bảo mật và tối ưu hóa DB cho nền tảng Viettel DMS SaaS trên kiến trúc mạng multi-zone.',
        'Đào tạo kỹ thuật cho thực tập sinh, xây dựng giáo án chuyên đề về Service Mesh, Canary, K8s.',
      ],
      tags: ['Kubernetes', 'Service Mesh', 'Multi-zone'],
    },
    {
      id: 'tech-junior-admin',
      role: 'Junior System Admin',
      role_vi: 'Quản trị Hệ thống (Junior)',
      company: 'Tech Company XYZ',
      period: '01/2024 ─ 06/2025',
      period_vi: '01/2024 ─ 06/2025',
      isCurrent: false,
      bullets: [
        'Deployed CI/CD pipelines and managed internal bare-metal server infrastructure.',
      ],
      bullets_vi: [
        'Triển khai CI/CD pipelines và quản lý hệ thống server nội bộ.',
      ],
      tags: ['CI/CD', 'Linux', 'Docker'],
    },
  ],
  education: [
    {
      id: 'hcmus-it',
      badge: 'Bachelor',
      period: '2019 ─ 2023',
      degree: 'Bachelor Computer Network and Information Security',
      degree_vi: 'Cử nhân Mạng máy tính và An toàn thông tin',
      school: 'UNIVERSITY OF SCIENCE - VNUHCM',
      school_vi: 'TRƯỜNG ĐẠI HỌC KHOA HỌC TỰ NHIÊN - ĐHQG-HCM',
      description: 'GPA: 3.64 / 4.00 · Ho Chi Minh City',
      description_vi: 'GPA: 3.64 / 4.00 · TP. Hồ Chí Minh',
    },
    {
      id: 'capstone-k8s',
      badge: 'LAB',
      period: 'Capstone Thesis',
      degree: 'Design & Automation of High-Availability Kubernetes Cluster',
      degree_vi: 'Thiết kế & Tự động hóa Cụm Kubernetes High-Availability',
      school: 'Engineering Capstone Thesis',
      school_vi: 'Đề tài tốt nghiệp Kỹ sư',
      description: 'Built zero-downtime failover architecture on bare-metal with HAProxy, Keepalived, Ansible, Jenkins Pipeline and Prometheus.',
      description_vi: 'Xây dựng kiến trúc chịu lỗi Zero-Downtime Failover trên bare-metal với HAProxy, Keepalived, Ansible, Jenkins Pipeline và Prometheus.',
    },
  ],
  projects: [
    {
      id: 'airgap',
      title: 'ansible-airgap-k8s',
      shortDesc: 'Ansible framework deploying HA Kubernetes in air-gapped environments.',
      shortDesc_vi: 'Framework Ansible deploy K8s HA trong môi trường biệt lập (Air-gapped).',
      description: 'A robust automation framework written in Ansible to deploy and configure a High Availability (HA) Kubernetes cluster in completely isolated (air-gapped) environments without internet access. Optimized for banking, defense, and telecommunications.',
      description_vi: 'Một framework tự động hóa mạnh mẽ viết bằng Ansible, nhằm triển khai và cấu hình hệ thống cụm Kubernetes High Availability (HA) hoàn toàn trong môi trường biệt lập (Air-gapped) không có internet. Tối ưu cho các hệ thống ngân hàng, quốc phòng và viễn thông.',
      tags: ['Ansible', 'Kubernetes', 'Ubuntu', 'HAProxy', 'Keepalived'],
      link: 'https://github.com/QuanBlue/ansible-airgap-k8s',
      color: 'emerald',
      status: 'ONLINE',
    },
    {
      id: 'portfolio',
      title: 'mern-portfolio',
      shortDesc: 'Fullstack MERN portfolio, demonstrating modern Web App architecture.',
      shortDesc_vi: 'Fullstack MERN portfolio cũ, nền tảng cho việc tư duy kiến trúc Web App.',
      description: 'Previous portfolio built with the MERN stack demonstrating RESTful APIs, database management, and automated deployment.',
      description_vi: 'Phiên bản Portfolio trước đây được xây dựng toàn bộ bằng stack MERN. Dự án thể hiện nền tảng vững chắc về phát triển Web Fullstack, xử lý RESTful APIs, quản lý Database và tự động hóa deployment quy mô nhỏ.',
      tags: ['React', 'Node.js', 'Express', 'MongoDB'],
      link: 'https://github.com/QuanBlue/mern-portfolio',
      color: 'blue',
      status: 'ONLINE',
    },
  ],
  telemetry: {
    uptimeSLA: '99.9%',
    initialReqCount: 2489,
    traceId: '#req-a7f8b9',
    traceLatency: '145ms',
    spans: [
      { name: 'ingress-nginx (145ms)', duration: '145ms', leftPercent: 0, widthPercent: 95, color: 'emerald', delay: '0s' },
      { name: 'api-gateway (120ms)', duration: '120ms', leftPercent: 5, widthPercent: 80, color: 'blue', delay: '0.15s' },
      { name: 'auth-svc (45ms)', duration: '45ms', leftPercent: 15, widthPercent: 30, color: 'purple', delay: '0.3s' },
      { name: 'postgres-db (65ms)', duration: '65ms', leftPercent: 40, widthPercent: 45, color: 'orange', delay: '0.45s' },
    ],
  },
  gallery: [],
  appearance: {
    activeTheme: 'ascii',
    colorMode: 'dark',
  },
  careerSettings: {
    openToWork: true,
    cvUrl: '/cv.pdf',
  },
};

// Build-time content override: drop an exported `content.json` into src/data/ and commit it.
const buildOverrides = import.meta.glob<Partial<PortfolioData>>('./content.json', {
  eager: true,
  import: 'default',
});

export function mergePortfolioData(
  base: PortfolioData,
  override?: Partial<PortfolioData> | null,
): PortfolioData {
  if (!override) return base;
  const mergedIdentity = { ...base.identity, ...(override.identity ?? {}) };
  const mergedCareerSettings: CareerSettings = {
    openToWork:
      override.careerSettings?.openToWork ??
      override.identity?.openToWork ??
      base.careerSettings?.openToWork ??
      base.identity?.openToWork ??
      true,
    cvUrl:
      override.careerSettings?.cvUrl ??
      override.identity?.cvUrl ??
      base.careerSettings?.cvUrl ??
      base.identity?.cvUrl ??
      '/cv.pdf',
  };
  return {
    ...base,
    ...override,
    identity: mergedIdentity,
    appearance: { ...(base.appearance ?? { activeTheme: 'ascii', colorMode: 'dark' }), ...(override.appearance ?? {}) },
    careerSettings: mergedCareerSettings,
  } as PortfolioData;
}

export const portfolioData: PortfolioData = mergePortfolioData(
  defaultPortfolioData,
  Object.values(buildOverrides)[0] ?? null,
);
