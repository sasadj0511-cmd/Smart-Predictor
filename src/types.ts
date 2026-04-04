export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  startTime: string;
  homeId: number;
  awayId: number;
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
}

export interface Prediction {
  id: string;
  fixture_id: number;
  match_name: string;
  prediction: string;
  confidence: number;
  analysis: string;
  detailed_analysis?: string;
  weather?: string;
  match_time?: string;
  over_under?: string;
  over_under_conf?: number;
  btts?: string;
  btts_conf?: number;
  goals?: string;
  half_time?: string;
  half_time_conf?: number;
  injuries?: string;
  timestamp: any;
  status: 'pending' | 'completed' | 'failed';
}

export interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
