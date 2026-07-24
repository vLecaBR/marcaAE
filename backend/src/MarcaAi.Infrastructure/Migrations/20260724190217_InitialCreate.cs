using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MarcaAi.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:BookingStatus", "PENDING,CONFIRMED,CANCELLED,RESCHEDULED,NO_SHOW")
                .Annotation("Npgsql:Enum:CanceledBy", "OWNER,GUEST,SYSTEM")
                .Annotation("Npgsql:Enum:EventTypeColor", "SLATE,ROSE,ORANGE,AMBER,EMERALD,TEAL,CYAN,VIOLET,FUCHSIA")
                .Annotation("Npgsql:Enum:ExceptionType", "BLOCKED,VACATION,OVERRIDE")
                .Annotation("Npgsql:Enum:LocationType", "GOOGLE_MEET,ZOOM,TEAMS,PHONE,IN_PERSON,CUSTOM")
                .Annotation("Npgsql:Enum:PaymentStatus", "UNPAID,PAID,REFUNDED")
                .Annotation("Npgsql:Enum:QuestionType", "TEXT,TEXTAREA,SELECT,CHECKBOX,PHONE")
                .Annotation("Npgsql:Enum:TeamRole", "OWNER,ADMIN,MEMBER")
                .Annotation("Npgsql:Enum:Theme", "DARK,LIGHT,SYSTEM");

            migrationBuilder.CreateTable(
                name: "teams",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    slug = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    logo = table.Column<string>(type: "text", nullable: true),
                    theme = table.Column<int>(type: "integer", nullable: false),
                    brandColor = table.Column<string>(type: "text", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teams", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: true),
                    email = table.Column<string>(type: "text", nullable: false),
                    emailVerified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    image = table.Column<string>(type: "text", nullable: true),
                    username = table.Column<string>(type: "text", nullable: true),
                    bio = table.Column<string>(type: "text", nullable: true),
                    timeZone = table.Column<string>(type: "text", nullable: false),
                    locale = table.Column<string>(type: "text", nullable: false),
                    onboarded = table.Column<bool>(type: "boolean", nullable: false),
                    theme = table.Column<int>(type: "integer", nullable: false),
                    brandColor = table.Column<string>(type: "text", nullable: true),
                    recurringEventId = table.Column<string>(type: "text", nullable: true),
                    recurringIndex = table.Column<int>(type: "integer", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "verification_tokens",
                columns: table => new
                {
                    identifier = table.Column<string>(type: "text", nullable: false),
                    token = table.Column<string>(type: "text", nullable: false),
                    expires = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_verification_tokens", x => new { x.identifier, x.token });
                });

            migrationBuilder.CreateTable(
                name: "subscriptions",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    teamId = table.Column<string>(type: "text", nullable: false),
                    stripeCustomerId = table.Column<string>(type: "text", nullable: false),
                    stripeSubscriptionId = table.Column<string>(type: "text", nullable: true),
                    stripePriceId = table.Column<string>(type: "text", nullable: true),
                    stripeCurrentPeriodEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subscriptions", x => x.id);
                    table.ForeignKey(
                        name: "FK_subscriptions_teams_teamId",
                        column: x => x.teamId,
                        principalTable: "teams",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "accounts",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    provider = table.Column<string>(type: "text", nullable: false),
                    providerAccountId = table.Column<string>(type: "text", nullable: false),
                    refresh_token = table.Column<string>(type: "text", nullable: true),
                    access_token = table.Column<string>(type: "text", nullable: true),
                    expires_at = table.Column<int>(type: "integer", nullable: true),
                    token_type = table.Column<string>(type: "text", nullable: true),
                    scope = table.Column<string>(type: "text", nullable: true),
                    id_token = table.Column<string>(type: "text", nullable: true),
                    session_state = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_accounts", x => x.id);
                    table.ForeignKey(
                        name: "FK_accounts_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "event_types",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    slug = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    duration = table.Column<int>(type: "integer", nullable: false),
                    color = table.Column<int>(type: "integer", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    requiresConfirm = table.Column<bool>(type: "boolean", nullable: false),
                    beforeEventBuffer = table.Column<int>(type: "integer", nullable: false),
                    afterEventBuffer = table.Column<int>(type: "integer", nullable: false),
                    bookingLimitDays = table.Column<int>(type: "integer", nullable: true),
                    locationType = table.Column<int>(type: "integer", nullable: false),
                    locationValue = table.Column<string>(type: "text", nullable: true),
                    price = table.Column<int>(type: "integer", nullable: true),
                    currency = table.Column<string>(type: "text", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    teamId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_event_types", x => x.id);
                    table.ForeignKey(
                        name: "FK_event_types_teams_teamId",
                        column: x => x.teamId,
                        principalTable: "teams",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_event_types_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "schedules",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    timeZone = table.Column<string>(type: "text", nullable: false),
                    isDefault = table.Column<bool>(type: "boolean", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_schedules", x => x.id);
                    table.ForeignKey(
                        name: "FK_schedules_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sessions",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    sessionToken = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    expires = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sessions", x => x.id);
                    table.ForeignKey(
                        name: "FK_sessions_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "team_members",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    teamId = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    role = table.Column<int>(type: "integer", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_team_members", x => x.id);
                    table.ForeignKey(
                        name: "FK_team_members_teams_teamId",
                        column: x => x.teamId,
                        principalTable: "teams",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_team_members_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "bookings",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    uid = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    eventTypeId = table.Column<string>(type: "text", nullable: false),
                    guestName = table.Column<string>(type: "text", nullable: false),
                    guestEmail = table.Column<string>(type: "text", nullable: false),
                    guestPhone = table.Column<string>(type: "text", nullable: true),
                    guestNotes = table.Column<string>(type: "text", nullable: true),
                    startTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    endTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    guestTimeZone = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    cancelReason = table.Column<string>(type: "text", nullable: true),
                    canceledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    canceledBy = table.Column<int>(type: "integer", nullable: true),
                    meetingUrl = table.Column<string>(type: "text", nullable: true),
                    meetingId = table.Column<string>(type: "text", nullable: true),
                    reminderSent = table.Column<bool>(type: "boolean", nullable: false),
                    paymentStatus = table.Column<int>(type: "integer", nullable: false),
                    paymentReference = table.Column<string>(type: "text", nullable: true),
                    recurringEventId = table.Column<string>(type: "text", nullable: true),
                    recurringIndex = table.Column<int>(type: "integer", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bookings", x => x.id);
                    table.ForeignKey(
                        name: "FK_bookings_event_types_eventTypeId",
                        column: x => x.eventTypeId,
                        principalTable: "event_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_bookings_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "event_type_questions",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    eventTypeId = table.Column<string>(type: "text", nullable: false),
                    label = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<int>(type: "integer", nullable: false),
                    placeholder = table.Column<string>(type: "text", nullable: true),
                    required = table.Column<bool>(type: "boolean", nullable: false),
                    order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_event_type_questions", x => x.id);
                    table.ForeignKey(
                        name: "FK_event_type_questions_event_types_eventTypeId",
                        column: x => x.eventTypeId,
                        principalTable: "event_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "schedule_availabilities",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    scheduleId = table.Column<string>(type: "text", nullable: false),
                    dayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    startTime = table.Column<string>(type: "text", nullable: false),
                    endTime = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_schedule_availabilities", x => x.id);
                    table.ForeignKey(
                        name: "FK_schedule_availabilities_schedules_scheduleId",
                        column: x => x.scheduleId,
                        principalTable: "schedules",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "schedule_exceptions",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    scheduleId = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    date = table.Column<DateOnly>(type: "date", nullable: false),
                    type = table.Column<int>(type: "integer", nullable: false),
                    startTime = table.Column<string>(type: "text", nullable: true),
                    endTime = table.Column<string>(type: "text", nullable: true),
                    reason = table.Column<string>(type: "text", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_schedule_exceptions", x => x.id);
                    table.ForeignKey(
                        name: "FK_schedule_exceptions_schedules_scheduleId",
                        column: x => x.scheduleId,
                        principalTable: "schedules",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_schedule_exceptions_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "booking_responses",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    bookingId = table.Column<string>(type: "text", nullable: false),
                    questionId = table.Column<string>(type: "text", nullable: false),
                    answer = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_booking_responses", x => x.id);
                    table.ForeignKey(
                        name: "FK_booking_responses_bookings_bookingId",
                        column: x => x.bookingId,
                        principalTable: "bookings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_accounts_provider_providerAccountId",
                table: "accounts",
                columns: new[] { "provider", "providerAccountId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_accounts_userId",
                table: "accounts",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_booking_responses_bookingId",
                table: "booking_responses",
                column: "bookingId");

            migrationBuilder.CreateIndex(
                name: "IX_bookings_eventTypeId",
                table: "bookings",
                column: "eventTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_bookings_guestEmail",
                table: "bookings",
                column: "guestEmail");

            migrationBuilder.CreateIndex(
                name: "IX_bookings_startTime",
                table: "bookings",
                column: "startTime");

            migrationBuilder.CreateIndex(
                name: "IX_bookings_status",
                table: "bookings",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_bookings_uid",
                table: "bookings",
                column: "uid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_bookings_userId",
                table: "bookings",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_bookings_userId_startTime_endTime_status",
                table: "bookings",
                columns: new[] { "userId", "startTime", "endTime", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_event_type_questions_eventTypeId",
                table: "event_type_questions",
                column: "eventTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_event_types_slug",
                table: "event_types",
                column: "slug");

            migrationBuilder.CreateIndex(
                name: "IX_event_types_teamId",
                table: "event_types",
                column: "teamId");

            migrationBuilder.CreateIndex(
                name: "IX_event_types_userId",
                table: "event_types",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_event_types_userId_slug",
                table: "event_types",
                columns: new[] { "userId", "slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_schedule_availabilities_scheduleId",
                table: "schedule_availabilities",
                column: "scheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_schedule_exceptions_date",
                table: "schedule_exceptions",
                column: "date");

            migrationBuilder.CreateIndex(
                name: "IX_schedule_exceptions_scheduleId",
                table: "schedule_exceptions",
                column: "scheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_schedule_exceptions_userId",
                table: "schedule_exceptions",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_schedules_userId",
                table: "schedules",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_sessions_sessionToken",
                table: "sessions",
                column: "sessionToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sessions_userId",
                table: "sessions",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_subscriptions_stripeCustomerId",
                table: "subscriptions",
                column: "stripeCustomerId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_subscriptions_stripeSubscriptionId",
                table: "subscriptions",
                column: "stripeSubscriptionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_subscriptions_teamId",
                table: "subscriptions",
                column: "teamId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_team_members_teamId",
                table: "team_members",
                column: "teamId");

            migrationBuilder.CreateIndex(
                name: "IX_team_members_teamId_userId",
                table: "team_members",
                columns: new[] { "teamId", "userId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_team_members_userId",
                table: "team_members",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_teams_slug",
                table: "teams",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_username",
                table: "users",
                column: "username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_verification_tokens_token",
                table: "verification_tokens",
                column: "token",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "accounts");

            migrationBuilder.DropTable(
                name: "booking_responses");

            migrationBuilder.DropTable(
                name: "event_type_questions");

            migrationBuilder.DropTable(
                name: "schedule_availabilities");

            migrationBuilder.DropTable(
                name: "schedule_exceptions");

            migrationBuilder.DropTable(
                name: "sessions");

            migrationBuilder.DropTable(
                name: "subscriptions");

            migrationBuilder.DropTable(
                name: "team_members");

            migrationBuilder.DropTable(
                name: "verification_tokens");

            migrationBuilder.DropTable(
                name: "bookings");

            migrationBuilder.DropTable(
                name: "schedules");

            migrationBuilder.DropTable(
                name: "event_types");

            migrationBuilder.DropTable(
                name: "teams");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
