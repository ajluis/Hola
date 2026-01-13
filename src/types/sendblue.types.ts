export interface SendblueInboundMessage {
  accountEmail: string;
  content: string;
  media_url: string | null;
  is_outbound: boolean;
  status: string;
  error_code: number | null;
  error_message: string | null;
  message_handle: string;
  date_sent: string;
  date_updated: string;
  from_number: string;
  number: string;
  to_number: string;
  was_downgraded: boolean;
  plan: string;
}

export interface SendblueStatusUpdate {
  accountEmail: string;
  content: string;
  is_outbound: boolean;
  status: string;
  error_code: number | null;
  error_message: string | null;
  message_handle: string;
  date_sent: string;
  date_updated: string;
  from_number: string;
  number: string;
  to_number: string;
  was_downgraded: boolean;
}

export interface SendblueSendRequest {
  number: string;
  content: string;
  send_style?: 'default' | 'invisible';
  media_url?: string;
  status_callback?: string;
}

export interface SendblueSendResponse {
  accountEmail: string;
  content: string;
  is_outbound: boolean;
  status: string;
  error_code: number | null;
  error_message: string | null;
  message_handle: string;
  date_sent: string;
  date_updated: string;
  from_number: string;
  number: string;
  to_number: string;
  was_downgraded: boolean;
  media_url: string | null;
}
