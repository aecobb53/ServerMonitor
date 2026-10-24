/** Matches the server shape from GET /api/server-status → games[].servers[] */
export interface Server {
  id: string;
  name: string;
  game: string;
  container_status: string;
  server_status: string;
  healthy: boolean;
  last_message: string;
  updated: string;
}

/** Matches GET /api/server-info/:name */
export interface ServerInfo {
  server_name: string;
  display_name: string;
  game: string;
  description: string;
  container_status: string;
  timestamp: string;
  server_status_list: ServerStatusEntry[];
  display_status: string;
}

export interface ServerStatusEntry {
  status: string;
  message: string;
  timestamp: string;
}

export type ServerStatus = 'ONLINE' | 'OFFLINE' | 'STARTING' | 'UPDATING' | 'REGISTERING' | 'RESTARTING' | 'ERROR' | 'UNKNOWN';
