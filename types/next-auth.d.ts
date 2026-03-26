import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  /**
   * Estende a sessão padrão para incluir nossos campos customizados
   */
  interface Session {
    user: {
      id: string;
      username?: string | null;
      timeZone?: string | null;
      onboarded?: boolean;
    } & DefaultSession["user"];
  }

  /**
   * Estende o usuário padrão do banco de dados/adapter
   */
  interface User extends DefaultUser {
    username?: string | null;
    timeZone?: string | null;
    onboarded?: boolean;
  }
}