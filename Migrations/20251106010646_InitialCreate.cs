using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace micro_dashboard_roi.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tb_campanhas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    nome_campanha = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    nome_produto = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tb_campanhas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tb_lancamentos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    data_lancamento = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    gasto = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    receita = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CampaignId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tb_lancamentos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_tb_lancamentos_tb_campanhas_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "tb_campanhas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tb_lancamentos_CampaignId",
                table: "tb_lancamentos",
                column: "CampaignId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tb_lancamentos");

            migrationBuilder.DropTable(
                name: "tb_campanhas");
        }
    }
}
