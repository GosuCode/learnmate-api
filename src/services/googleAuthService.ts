import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/prisma';
import { UserService } from '@/services/userService';

export interface GoogleUserInfo {
    sub: string; // Google ID
    email: string;
    name: string;
    picture?: string;
    email_verified: boolean;
}

export class GoogleAuthService {
    private googleClient: OAuth2Client;
    private userService: UserService;

    constructor() {
        this.googleClient = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        this.userService = new UserService();
    }

    async verifyGoogleToken(idToken: string): Promise<GoogleUserInfo> {
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload) {
                throw new Error('Invalid Google token');
            }

            return {
                sub: payload.sub,
                email: payload.email!,
                name: payload.name!,
                picture: payload.picture,
                email_verified: payload.email_verified || false,
            };
        } catch (error) {
            throw new Error('Failed to verify Google token');
        }
    }

    async authenticateWithGoogle(idToken: string) {
        try {
            // Verify the Google token
            const googleUser = await this.verifyGoogleToken(idToken);

            // Check if user exists with this Google ID
            let user = await prisma.user.findUnique({
                where: { googleId: googleUser.sub },
            });

            if (!user) {
                // Check if user exists with this email (for linking accounts)
                user = await prisma.user.findUnique({
                    where: { email: googleUser.email },
                });

                if (user) {
                    // User exists but doesn't have Google ID - link the accounts
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            googleId: googleUser.sub,
                            authProvider: 'google',
                            emailVerified: googleUser.email_verified,
                            avatar: googleUser.picture,
                        },
                    });
                } else {
                    // Create new user with Google OAuth
                    user = await prisma.user.create({
                        data: {
                            email: googleUser.email,
                            name: googleUser.name,
                            googleId: googleUser.sub,
                            authProvider: 'google',
                            emailVerified: googleUser.email_verified,
                            avatar: googleUser.picture,
                        },
                    });
                }
            }

            // Generate JWT token for the user
            const token = this.userService.generateToken(user.id, user.email);

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    avatar: user.avatar,
                    authProvider: user.authProvider,
                    emailVerified: user.emailVerified,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
                token,
            };
        } catch (error) {
            throw new Error('Google authentication failed');
        }
    }

    async getGoogleAuthUrl() {
        const redirectUri = `${process.env.BASE_URL}/api/auth/google/callback`;

        return this.googleClient.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email',
            ],
            redirect_uri: redirectUri,
        });
    }

    async handleGoogleCallback(code: string) {
        try {
            const redirectUri = `${process.env.BASE_URL}/api/auth/google/callback`;

            const { tokens } = await this.googleClient.getToken({
                code,
                redirect_uri: redirectUri,
            });

            if (!tokens.id_token) {
                throw new Error('No ID token received from Google');
            }

            return await this.authenticateWithGoogle(tokens.id_token);
        } catch (error) {
            throw new Error('Failed to handle Google callback');
        }
    }
} 