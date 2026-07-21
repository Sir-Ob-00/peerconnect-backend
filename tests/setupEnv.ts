process.env.NODE_ENV = "test";
process.env.PORT = "4000";
process.env.API_VERSION = "v1";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/peerconnect_test?schema=public";
process.env.CORS_ORIGIN = "*";
process.env.RATE_LIMIT_WINDOW_MS = "900000";
process.env.RATE_LIMIT_MAX_REQUESTS = "1000";
process.env.LOG_LEVEL = "error";

process.env.JWT_ACCESS_SECRET = "test-access-secret-0123456789-0123456789-abcdef";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-9876543210-9876543210-fedcba";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.JWT_REFRESH_EXPIRES_IN_MS = String(7 * 24 * 60 * 60 * 1000);
// Lower cost factor than production default — same algorithm, much faster tests.
process.env.BCRYPT_SALT_ROUNDS = "4";
process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN_MINUTES = "30";

process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-api-key";
process.env.CLOUDINARY_API_SECRET = "test-api-secret";
process.env.CLOUDINARY_UPLOAD_FOLDER = "peerconnect/test-profile-photos";
process.env.MAX_PROFILE_PHOTO_SIZE_MB = "5";
process.env.CLOUDINARY_CHAT_UPLOAD_FOLDER = "peerconnect/test-chat-images";
process.env.MAX_CHAT_IMAGE_SIZE_MB = "5";

process.env.SMTP_HOST = "smtp.ethereal.email";
process.env.SMTP_PORT = "587";
process.env.SMTP_SECURE = "false";
process.env.SMTP_USER = "test-user";
process.env.SMTP_PASSWORD = "test-password";
process.env.EMAIL_FROM = "PeerConnect <no-reply@peerconnect.app>";
