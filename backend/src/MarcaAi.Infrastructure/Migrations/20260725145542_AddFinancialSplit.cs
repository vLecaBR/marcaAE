using System;
using MarcaAi.Domain.Enums;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MarcaAi.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFinancialSplit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:BookingStatus", "CANCELLED,CONFIRMED,NO_SHOW,PENDING,RESCHEDULED")
                .Annotation("Npgsql:Enum:CanceledBy", "GUEST,OWNER,SYSTEM")
                .Annotation("Npgsql:Enum:EventTypeColor", "AMBER,CYAN,EMERALD,FUCHSIA,ORANGE,ROSE,SLATE,TEAL,VIOLET")
                .Annotation("Npgsql:Enum:ExceptionType", "BLOCKED,OVERRIDE,VACATION")
                .Annotation("Npgsql:Enum:LocationType", "CUSTOM,GOOGLE_MEET,IN_PERSON,PHONE,TEAMS,ZOOM")
                .Annotation("Npgsql:Enum:PaymentProvider", "MERCADO_PAGO,STRIPE")
                .Annotation("Npgsql:Enum:PaymentStatus", "FAILED,PAID,PARTIALLY_REFUNDED,PENDING,REFUNDED,UNPAID")
                .Annotation("Npgsql:Enum:PayoutAccountStatus", "ACTIVE,DISABLED,PENDING,RESTRICTED")
                .Annotation("Npgsql:Enum:PayoutOwnerType", "TEAM,USER")
                .Annotation("Npgsql:Enum:QuestionType", "CHECKBOX,PHONE,SELECT,TEXT,TEXTAREA")
                .Annotation("Npgsql:Enum:TeamRole", "ADMIN,MEMBER,OWNER")
                .Annotation("Npgsql:Enum:Theme", "DARK,LIGHT,SYSTEM")
                .OldAnnotation("Npgsql:Enum:BookingStatus", "CANCELLED,CONFIRMED,NO_SHOW,PENDING,RESCHEDULED")
                .OldAnnotation("Npgsql:Enum:CanceledBy", "GUEST,OWNER,SYSTEM")
                .OldAnnotation("Npgsql:Enum:EventTypeColor", "AMBER,CYAN,EMERALD,FUCHSIA,ORANGE,ROSE,SLATE,TEAL,VIOLET")
                .OldAnnotation("Npgsql:Enum:ExceptionType", "BLOCKED,OVERRIDE,VACATION")
                .OldAnnotation("Npgsql:Enum:LocationType", "CUSTOM,GOOGLE_MEET,IN_PERSON,PHONE,TEAMS,ZOOM")
                .OldAnnotation("Npgsql:Enum:PaymentStatus", "PAID,REFUNDED,UNPAID")
                .OldAnnotation("Npgsql:Enum:QuestionType", "CHECKBOX,PHONE,SELECT,TEXT,TEXTAREA")
                .OldAnnotation("Npgsql:Enum:TeamRole", "ADMIN,MEMBER,OWNER")
                .OldAnnotation("Npgsql:Enum:Theme", "DARK,LIGHT,SYSTEM");

            migrationBuilder.AddColumn<int>(
                name: "defaultFeeBps",
                table: "subscriptions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "planCode",
                table: "subscriptions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "quantity",
                table: "subscriptions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "currency",
                table: "bookings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "gatewayFeeCents",
                table: "bookings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "netToProviderCents",
                table: "bookings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "paidAt",
                table: "bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<PaymentProvider>(
                name: "paymentProvider",
                table: "bookings",
                type: "\"PaymentProvider\"",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "payoutAccountId",
                table: "bookings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "platformFeeCents",
                table: "bookings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "priceCents",
                table: "bookings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "providerPaymentId",
                table: "bookings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "refundedAt",
                table: "bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "payout_accounts",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    ownerType = table.Column<PayoutOwnerType>(type: "\"PayoutOwnerType\"", nullable: false),
                    ownerId = table.Column<string>(type: "text", nullable: false),
                    provider = table.Column<PaymentProvider>(type: "\"PaymentProvider\"", nullable: false),
                    externalAccountId = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<PayoutAccountStatus>(type: "\"PayoutAccountStatus\"", nullable: false),
                    chargesEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    payoutsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    onboardingUrl = table.Column<string>(type: "text", nullable: true),
                    feePercentBps = table.Column<int>(type: "integer", nullable: true),
                    feeFixedCents = table.Column<int>(type: "integer", nullable: true),
                    absorbGatewayCost = table.Column<bool>(type: "boolean", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payout_accounts", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_bookings_payoutAccountId",
                table: "bookings",
                column: "payoutAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_bookings_providerPaymentId",
                table: "bookings",
                column: "providerPaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_payout_accounts_ownerType_ownerId",
                table: "payout_accounts",
                columns: new[] { "ownerType", "ownerId" });

            migrationBuilder.CreateIndex(
                name: "IX_payout_accounts_ownerType_ownerId_provider",
                table: "payout_accounts",
                columns: new[] { "ownerType", "ownerId", "provider" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_payout_accounts_provider_externalAccountId",
                table: "payout_accounts",
                columns: new[] { "provider", "externalAccountId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "payout_accounts");

            migrationBuilder.DropIndex(
                name: "IX_bookings_payoutAccountId",
                table: "bookings");

            migrationBuilder.DropIndex(
                name: "IX_bookings_providerPaymentId",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "defaultFeeBps",
                table: "subscriptions");

            migrationBuilder.DropColumn(
                name: "planCode",
                table: "subscriptions");

            migrationBuilder.DropColumn(
                name: "quantity",
                table: "subscriptions");

            migrationBuilder.DropColumn(
                name: "currency",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "gatewayFeeCents",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "netToProviderCents",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "paidAt",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "paymentProvider",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "payoutAccountId",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "platformFeeCents",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "priceCents",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "providerPaymentId",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "refundedAt",
                table: "bookings");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:BookingStatus", "CANCELLED,CONFIRMED,NO_SHOW,PENDING,RESCHEDULED")
                .Annotation("Npgsql:Enum:CanceledBy", "GUEST,OWNER,SYSTEM")
                .Annotation("Npgsql:Enum:EventTypeColor", "AMBER,CYAN,EMERALD,FUCHSIA,ORANGE,ROSE,SLATE,TEAL,VIOLET")
                .Annotation("Npgsql:Enum:ExceptionType", "BLOCKED,OVERRIDE,VACATION")
                .Annotation("Npgsql:Enum:LocationType", "CUSTOM,GOOGLE_MEET,IN_PERSON,PHONE,TEAMS,ZOOM")
                .Annotation("Npgsql:Enum:PaymentStatus", "PAID,REFUNDED,UNPAID")
                .Annotation("Npgsql:Enum:QuestionType", "CHECKBOX,PHONE,SELECT,TEXT,TEXTAREA")
                .Annotation("Npgsql:Enum:TeamRole", "ADMIN,MEMBER,OWNER")
                .Annotation("Npgsql:Enum:Theme", "DARK,LIGHT,SYSTEM")
                .OldAnnotation("Npgsql:Enum:BookingStatus", "CANCELLED,CONFIRMED,NO_SHOW,PENDING,RESCHEDULED")
                .OldAnnotation("Npgsql:Enum:CanceledBy", "GUEST,OWNER,SYSTEM")
                .OldAnnotation("Npgsql:Enum:EventTypeColor", "AMBER,CYAN,EMERALD,FUCHSIA,ORANGE,ROSE,SLATE,TEAL,VIOLET")
                .OldAnnotation("Npgsql:Enum:ExceptionType", "BLOCKED,OVERRIDE,VACATION")
                .OldAnnotation("Npgsql:Enum:LocationType", "CUSTOM,GOOGLE_MEET,IN_PERSON,PHONE,TEAMS,ZOOM")
                .OldAnnotation("Npgsql:Enum:PaymentProvider", "MERCADO_PAGO,STRIPE")
                .OldAnnotation("Npgsql:Enum:PaymentStatus", "FAILED,PAID,PARTIALLY_REFUNDED,PENDING,REFUNDED,UNPAID")
                .OldAnnotation("Npgsql:Enum:PayoutAccountStatus", "ACTIVE,DISABLED,PENDING,RESTRICTED")
                .OldAnnotation("Npgsql:Enum:PayoutOwnerType", "TEAM,USER")
                .OldAnnotation("Npgsql:Enum:QuestionType", "CHECKBOX,PHONE,SELECT,TEXT,TEXTAREA")
                .OldAnnotation("Npgsql:Enum:TeamRole", "ADMIN,MEMBER,OWNER")
                .OldAnnotation("Npgsql:Enum:Theme", "DARK,LIGHT,SYSTEM");
        }
    }
}
