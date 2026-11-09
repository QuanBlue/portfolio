export interface Identity {
  name: string;
  role: string;
  node: string;
  ip: string;
  location: string;
  email: string;
  linkedin: {
    handle: string;
    url: string;
  };
  github: {
    handle: string;
    url: string;
  };
  bio: string;
}

export interface Skill {
  id: string;
  tag: string;
  name: string;
  status: 'ACTIVE' | 'SYNCING';
  delay?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  color: 'yellow' | 'blue';
  delay?: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  isCurrent: boolean;
  bullets: string[];
  tags: string[];
}

export interface Project {
  id: string;
  title: string;
  shortDesc: string;
  description: string;
  tags: string[];
  link: string;
  color: 'emerald' | 'blue' | 'purple' | 'orange';
  status: 'ONLINE' | 'MAINTENANCE';
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

export interface PortfolioData {
  identity: Identity;
  skills: Skill[];
  certifications: Certification[];
  experience: ExperienceItem[];
  projects: Project[];
  telemetry: Telemetry;
}

export const portfolioData: PortfolioData = {
  identity: {
    name: 'Nguyễn Thanh Quân',
    role: 'DevOps Engineer',
    node: 'HCM-VNM-01',
    ip: '192.168.1.104',
    location: 'Ho Chi Minh, VN',
    email: 'quan.devops@email.com',
    linkedin: {
      handle: 'in/quanblue',
      url: 'https://linkedin.com/in/quanblue',
    },
    github: {
      handle: '@QuanBlue',
      url: 'https://github.com/QuanBlue',
    },
    bio: 'DevOps Engineer focusing on container orchestration, automated infrastructure deployment, high-availability multi-zone networking, and production observability.',
  },
  skills: [
    { id: 'k8s', tag: '[k8s-core]', name: 'Kubernetes', status: 'ACTIVE', delay: '0s' },
    { id: 'docker', tag: '[containerd]', name: 'Docker', status: 'ACTIVE', delay: '0.2s' },
    { id: 'ansible', tag: '[cfg-mgmt]', name: 'Ansible', status: 'ACTIVE', delay: '0.5s' },
    { id: 'prometheus', tag: '[metrics-db]', name: 'Prometheus', status: 'ACTIVE', delay: '0.1s' },
    { id: 'linux', tag: '[sys-kernel]', name: 'Linux/Ubuntu', status: 'ACTIVE', delay: '0.7s' },
    { id: 'haproxy', tag: '[l4-proxy]', name: 'HAProxy', status: 'ACTIVE', delay: '0.4s' },
    { id: 'istio', tag: '[svc-mesh]', name: 'Istio', status: 'SYNCING', delay: '0.3s' },
  ],
  certifications: [
    { id: 'cka', name: 'CKA: Certified K8s Admin', issuer: 'Cloud Native Computing Foundation', color: 'yellow', delay: '0s' },
    { id: 'aws-sa', name: 'AWS Solutions Architect', issuer: 'Amazon Web Services', color: 'blue', delay: '0.5s' },
  ],
  experience: [
    {
      id: 'viettel-devops',
      role: 'DevOps Engineer',
      company: 'Viettel',
      period: '07/2025 - Hiện tại',
      isCurrent: true,
      bullets: [
        'Quản lý infrastructure sizing, tăng cường bảo mật và tối ưu hóa DB cho nền tảng Viettel DMS SaaS trên kiến trúc mạng multi-zone.',
        'Đào tạo kỹ thuật cho thực tập sinh, xây dựng giáo án chuyên đề về Service Mesh, Canary, K8s.',
      ],
      tags: ['Kubernetes', 'Service Mesh', 'Multi-zone'],
    },
    {
      id: 'tech-junior-admin',
      role: 'Junior System Admin',
      company: 'Tech Company XYZ',
      period: '01/2024 - 06/2025',
      isCurrent: false,
      bullets: [
        'Triển khai CI/CD pipelines và quản lý hệ thống server nội bộ.',
      ],
      tags: ['CI/CD', 'Linux', 'Docker'],
    },
  ],
  projects: [
    {
      id: 'airgap',
      title: 'ansible-airgap-k8s',
      shortDesc: 'Framework Ansible deploy K8s HA trong môi trường biệt lập (Air-gapped).',
      description: 'Một framework tự động hóa mạnh mẽ viết bằng Ansible, nhằm triển khai và cấu hình hệ thống cụm Kubernetes High Availability (HA) hoàn toàn trong môi trường biệt lập (Air-gapped) không có internet. Tối ưu cho các hệ thống ngân hàng, quốc phòng và viễn thông.',
      tags: ['Ansible', 'Kubernetes', 'Ubuntu', 'HAProxy', 'Keepalived'],
      link: 'https://github.com/QuanBlue/ansible-airgap-k8s',
      color: 'emerald',
      status: 'ONLINE',
    },
    {
      id: 'portfolio',
      title: 'mern-portfolio',
      shortDesc: 'Fullstack MERN portfolio cũ, nền tảng cho việc tư duy kiến trúc Web App.',
      description: 'Phiên bản Portfolio trước đây được xây dựng toàn bộ bằng stack MERN. Dự án thể hiện nền tảng vững chắc về phát triển Web Fullstack, xử lý RESTful APIs, quản lý Database và tự động hóa deployment quy mô nhỏ.',
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
};
