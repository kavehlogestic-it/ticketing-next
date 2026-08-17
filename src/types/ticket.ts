export interface User {
  accountId: number;
  username: string;
  fullName: string;
  roleId: number; // 1 = admin/responder, 2 = user/issuer
  roleName: "admin" | "user" | string;
  departmentId: number;
  userGroupId: number;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface TicketGroup {
  ticketGroupId: number;
  ticketGroupTitle: string;
}

export interface UserGroup {
  userGroupId: number;
  userGroupTitle: string;
}

export interface TicketSummary {
  ticketId: number;
  ticketSubject: string;
  ticketStatus: string;
  ticketGroupTitle: string;
  userGroupTitle: string;
  accountFullName: string;
  ticketAttachment: string | null;
  ticketDate: string;
  lastReplyDateTime: string;
  trackCode: string;
  departmentId: number;
  replyCount: number;
  ticketRate?: {
    rate: number | null;
    description: string | null;
  },
}

export interface TicketReply {
  replyId: number;
  text: string;
  accountId: number;
  accountFullName: string;
  roleId: number;
  ticketReplyAttachment: string | null;
  replyDate: string;
}

export interface TicketDetail extends TicketSummary {
  ticketDescription: string;
  replies: TicketReply[];
}

export interface PaginatedTickets {
  total: number;
  page: number;
  pageSize: number;
  items: TicketSummary[];
}

export interface TicketFilterParams {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateTicketPayload {
  TicketGroupId: number;
  TicketSubject: string;
  TicketDescription: string;
  DepartmentSelectList?: string;
  attachment?: File | null;
}

export interface ReplyTicketPayload {
  Text: string;
  attachment?: File | null;
}

export interface ChangeStatusPayload {
  status: string;
}

export interface RateTicketPayload {
  rate: number;
  description?: string;
}

export type RatingSubmission = RateTicketPayload;
