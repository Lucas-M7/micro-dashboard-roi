using micro_dashboard_roi.Controllers;
using micro_dashboard_roi.Data;
using micro_dashboard_roi.Services;
using micro_dashboard_roi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var sqlServerConnection = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(sqlServerConnection));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<ICampaignService, CampaignService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
    policy =>
    {
       policy.AllowAnyOrigin()
             .AllowAnyHeader()
             .AllowAnyMethod();    
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run();