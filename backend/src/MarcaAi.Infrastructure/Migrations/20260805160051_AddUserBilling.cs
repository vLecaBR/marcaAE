using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MarcaAi.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserBilling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "user_subscriptions",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    stripeCustomerId = table.Column<string>(type: "text", nullable: false),
                    stripeSubscriptionId = table.Column<string>(type: "text", nullable: true),
                    stripePriceId = table.Column<string>(type: "text", nullable: true),
                    stripeCurrentPeriodEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    planCode = table.Column<string>(type: "text", nullable: true),
                    defaultFeeBps = table.Column<int>(type: "integer", nullable: true),
                    trialEndsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_subscriptions", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_subscriptions_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_user_subscriptions_stripeCustomerId",
                table: "user_subscriptions",
                column: "stripeCustomerId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_subscriptions_stripeSubscriptionId",
                table: "user_subscriptions",
                column: "stripeSubscriptionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_subscriptions_userId",
                table: "user_subscriptions",
                column: "userId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_subscriptions");
        }
    }
}
