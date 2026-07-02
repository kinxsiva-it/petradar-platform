export interface AdminAuditLogActor {
  displayName: string;
  email: string;
  id: string;
}

export interface AdminAuditLogItem {
  action: string;
  actor: AdminAuditLogActor | null;
  createdAt: string;
  entityId: string;
  entityType: string;
  id: string;
  requestId: string | null;
  summary: string;
}

export interface AdminAuditLogsFilters {
  action?: string;
  actorQuery?: string;
  createdFrom?: string;
  createdTo?: string;
  entityId?: string;
  entityType?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminAuditLogsResponse {
  items: AdminAuditLogItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
