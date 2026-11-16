import { type AuthOptions, type Session, type User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/db";
import { User, type IUser } from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing email or password");
          return null;
        }
        try {
          await connectToDatabase();
          const user = await User.findOne({ email: credentials.email }) as unknown as IUser | null;
          if (!user) {
            console.log("No user found for email:", credentials.email);
            return null;
          }
          const hash = (user as any).passwordHash as string | undefined;
          if (!hash) {
            console.log("No passwordHash for user:", (user as any).email);
            return null;
          }
          const isValid = await bcrypt.compare(credentials.password, hash);
          if (!isValid) {
            console.log("Invalid password for user:", (user as any).email);
            return null;
          }
          console.log("Login successful for user:", (user as any).email);
          return {
            id: (user as any)._id.toString(),
            name: (user as any).name,
            email: (user as any).email,
            role: (user as any).role || "customer",
          } as any;
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.id = user.id;
        (token as any).role = (user as any).role || (token as any).role || "customer";
      }
      return token;
    },
    async session({ session, token }) {
      session.user = session.user || ({} as Session["user"]);
      (session.user as any).name = token.name as string | undefined;
      (session.user as any).email = token.email as string | undefined;
      (session.user as any).id = (token as any).id as string | undefined;
      (session.user as any).role = (token as any).role || "customer";
      return session;
    },
  },
  pages: {
    signIn: "/login"
  }
};
