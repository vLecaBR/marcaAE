CREATE TABLE IF NOT EXISTS __ef_migrations_history (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___ef_migrations_history" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW');
    CREATE TYPE "CanceledBy" AS ENUM ('OWNER', 'GUEST', 'SYSTEM');
    CREATE TYPE "EventTypeColor" AS ENUM ('SLATE', 'ROSE', 'ORANGE', 'AMBER', 'EMERALD', 'TEAL', 'CYAN', 'VIOLET', 'FUCHSIA');
    CREATE TYPE "ExceptionType" AS ENUM ('BLOCKED', 'VACATION', 'OVERRIDE');
    CREATE TYPE "LocationType" AS ENUM ('GOOGLE_MEET', 'ZOOM', 'TEAMS', 'PHONE', 'IN_PERSON', 'CUSTOM');
    CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'REFUNDED');
    CREATE TYPE "QuestionType" AS ENUM ('TEXT', 'TEXTAREA', 'SELECT', 'CHECKBOX', 'PHONE');
    CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
    CREATE TYPE "Theme" AS ENUM ('DARK', 'LIGHT', 'SYSTEM');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE TABLE teams (
        id text NOT NULL,
        name text NOT NULL,
        slug text NOT NULL,
        description text,
        logo text,
        theme integer NOT NULL,
        "brandColor" text,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_teams" PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE TABLE users (
        id text NOT NULL,
        name text,
        email text NOT NULL,
        "emailVerified" timestamp with time zone,
        image text,
        username text,
        bio text,
        "timeZone" text NOT NULL,
        locale text NOT NULL,
        onboarded boolean NOT NULL,
        theme integer NOT NULL,
        "brandColor" text,
        "recurringEventId" text,
        "recurringIndex" integer,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_users" PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE TABLE verification_tokens (
        identifier text NOT NULL,
        token text NOT NULL,
        expires timestamp with time zone NOT NULL,
        CONSTRAINT "PK_verification_tokens" PRIMARY KEY (identifier, token)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE TABLE subscriptions (
        id text NOT NULL,
        "teamId" text NOT NULL,
        "stripeCustomerId" text NOT NULL,
        "stripeSubscriptionId" text,
        "stripePriceId" text,
        "stripeCurrentPeriodEnd" timestamp with time zone,
        status text NOT NULL,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_subscriptions" PRIMARY KEY (id),
        CONSTRAINT "FK_subscriptions_teams_teamId" FOREIGN KEY ("teamId") REFERENCES teams (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE TABLE accounts (
        id text NOT NULL,
        "userId" text NOT NULL,
        type text NOT NULL,
        provider text NOT NULL,
        "providerAccountId" text NOT NULL,
        refresh_token text,
        access_token text,
        expires_at integer,
        token_type text,
        scope text,
        id_token text,
        session_state text,
        CONSTRAINT "PK_accounts" PRIMARY KEY (id),
        CONSTRAINT "FK_accounts_users_userId" FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE TABLE event_types (
        id text NOT NULL,
        "userId" text NOT NULL,
        title text NOT NULL,
        slug text NOT NULL,
        description text,
        duration integer NOT NULL,
        color integer NOT NULL,
        "isActive" boolean NOT NULL,
        "requiresConfirm" boolean NOT NULL,
        "beforeEventBuffer" integer NOT NULL,
        "afterEventBuffer" integer NOT NULL,
        "bookingLimitDays" integer,
        "locationType" integer NOT NULL,
        "locationValue" text,
        price integer,
        currency text NOT NULL,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL,
        "teamId" text,
        CONSTRAINT "PK_event_types" PRIMARY KEY (id),
        CONSTRAINT "FK_event_types_teams_teamId" FOREIGN KEY ("teamId") REFERENCES teams (id) ON DELETE CASCADE,
        CONSTRAINT "FK_event_types_users_userId" FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE TABLE schedules (
        id text NOT NULL,
        "userId" text NOT NULL,
        name text NOT NULL,
        "timeZone" text NOT NULL,
        "isDefault" boolean NOT NULL,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_schedules" PRIMARY KEY (id),
        CONSTRAINT "FK_schedules_users_userId" FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE TABLE sessions (
        id text NOT NULL,
        "sessionToken" text NOT NULL,
        "userId" text NOT NULL,
        expires timestamp with time zone NOT NULL,
        CONSTRAINT "PK_sessions" PRIMARY KEY (id),
        CONSTRAINT "FK_sessions_users_userId" FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE TABLE team_members (
        id text NOT NULL,
        "teamId" text NOT NULL,
        "userId" text NOT NULL,
        role integer NOT NULL,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_team_members" PRIMARY KEY (id),
        CONSTRAINT "FK_team_members_teams_teamId" FOREIGN KEY ("teamId") REFERENCES teams (id) ON DELETE CASCADE,
        CONSTRAINT "FK_team_members_users_userId" FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE TABLE bookings (
        id text NOT NULL,
        uid text NOT NULL,
        "userId" text NOT NULL,
        "eventTypeId" text NOT NULL,
        "guestName" text NOT NULL,
        "guestEmail" text NOT NULL,
        "guestPhone" text,
        "guestNotes" text,
        "startTime" timestamp with time zone NOT NULL,
        "endTime" timestamp with time zone NOT NULL,
        "guestTimeZone" text NOT NULL,
        status integer NOT NULL,
        "cancelReason" text,
        "canceledAt" timestamp with time zone,
        "canceledBy" integer,
        "meetingUrl" text,
        "meetingId" text,
        "reminderSent" boolean NOT NULL,
        "paymentStatus" integer NOT NULL,
        "paymentReference" text,
        "recurringEventId" text,
        "recurringIndex" integer,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_bookings" PRIMARY KEY (id),
        CONSTRAINT "FK_bookings_event_types_eventTypeId" FOREIGN KEY ("eventTypeId") REFERENCES event_types (id) ON DELETE CASCADE,
        CONSTRAINT "FK_bookings_users_userId" FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE TABLE event_type_questions (
        id text NOT NULL,
        "eventTypeId" text NOT NULL,
        label text NOT NULL,
        type integer NOT NULL,
        placeholder text,
        required boolean NOT NULL,
        "order" integer NOT NULL,
        CONSTRAINT "PK_event_type_questions" PRIMARY KEY (id),
        CONSTRAINT "FK_event_type_questions_event_types_eventTypeId" FOREIGN KEY ("eventTypeId") REFERENCES event_types (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE TABLE schedule_availabilities (
        id text NOT NULL,
        "scheduleId" text NOT NULL,
        "dayOfWeek" integer NOT NULL,
        "startTime" text NOT NULL,
        "endTime" text NOT NULL,
        CONSTRAINT "PK_schedule_availabilities" PRIMARY KEY (id),
        CONSTRAINT "FK_schedule_availabilities_schedules_scheduleId" FOREIGN KEY ("scheduleId") REFERENCES schedules (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE TABLE schedule_exceptions (
        id text NOT NULL,
        "scheduleId" text NOT NULL,
        "userId" text NOT NULL,
        date date NOT NULL,
        type integer NOT NULL,
        "startTime" text,
        "endTime" text,
        reason text,
        "createdAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_schedule_exceptions" PRIMARY KEY (id),
        CONSTRAINT "FK_schedule_exceptions_schedules_scheduleId" FOREIGN KEY ("scheduleId") REFERENCES schedules (id) ON DELETE CASCADE,
        CONSTRAINT "FK_schedule_exceptions_users_userId" FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE TABLE booking_responses (
        id text NOT NULL,
        "bookingId" text NOT NULL,
        "questionId" text NOT NULL,
        answer text NOT NULL,
        CONSTRAINT "PK_booking_responses" PRIMARY KEY (id),
        CONSTRAINT "FK_booking_responses_bookings_bookingId" FOREIGN KEY ("bookingId") REFERENCES bookings (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_accounts_provider_providerAccountId" ON accounts (provider, "providerAccountId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_accounts_userId" ON accounts ("userId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_booking_responses_bookingId" ON booking_responses ("bookingId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_bookings_eventTypeId" ON bookings ("eventTypeId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_bookings_guestEmail" ON bookings ("guestEmail");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_bookings_startTime" ON bookings ("startTime");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_bookings_status" ON bookings (status);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_bookings_uid" ON bookings (uid);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_bookings_userId" ON bookings ("userId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_bookings_userId_startTime_endTime_status" ON bookings ("userId", "startTime", "endTime", status);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_event_type_questions_eventTypeId" ON event_type_questions ("eventTypeId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_event_types_slug" ON event_types (slug);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_event_types_teamId" ON event_types ("teamId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_event_types_userId" ON event_types ("userId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_event_types_userId_slug" ON event_types ("userId", slug);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_schedule_availabilities_scheduleId" ON schedule_availabilities ("scheduleId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_schedule_exceptions_date" ON schedule_exceptions (date);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_schedule_exceptions_scheduleId" ON schedule_exceptions ("scheduleId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_schedule_exceptions_userId" ON schedule_exceptions ("userId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_schedules_userId" ON schedules ("userId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_sessions_sessionToken" ON sessions ("sessionToken");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_sessions_userId" ON sessions ("userId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_subscriptions_stripeCustomerId" ON subscriptions ("stripeCustomerId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_subscriptions_stripeSubscriptionId" ON subscriptions ("stripeSubscriptionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_subscriptions_teamId" ON subscriptions ("teamId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_team_members_teamId" ON team_members ("teamId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_team_members_teamId_userId" ON team_members ("teamId", "userId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE INDEX "IX_team_members_userId" ON team_members ("userId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_teams_slug" ON teams (slug);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_users_email" ON users (email);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_users_username" ON users (username);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_verification_tokens_token" ON verification_tokens (token);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM __ef_migrations_history WHERE "MigrationId" = '20260724190217_InitialCreate') THEN
    INSERT INTO __ef_migrations_history ("MigrationId", "ProductVersion")
    VALUES ('20260724190217_InitialCreate', '10.0.0');
    END IF;
END $EF$;
COMMIT;

