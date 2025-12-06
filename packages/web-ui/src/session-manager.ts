/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import type { Content } from '@google/genai';

interface Session {
  genAI: GoogleGenAI;
  history: Content[];
  createdAt: Date;
}

export class SessionManager {
  private sessions = new Map<string, Session>();
  private genAI: GoogleGenAI;

  constructor() {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenAI({
      apiKey,
    });
  }

  async createSession(id: string): Promise<Session> {
    const session: Session = {
      genAI: this.genAI,
      history: [],
      createdAt: new Date(),
    };

    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  destroySession(id: string): void {
    this.sessions.delete(id);
  }

  cleanupOldSessions(maxAgeMs: number = 3600000): void {
    const now = new Date();
    for (const [id, session] of this.sessions.entries()) {
      const age = now.getTime() - session.createdAt.getTime();
      if (age > maxAgeMs) {
        this.destroySession(id);
      }
    }
  }
}
