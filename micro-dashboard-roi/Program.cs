using micro_dashboard_roi.Data;
using micro_dashboard_roi.DTOs;
using micro_dashboard_roi.Middleware;
using micro_dashboard_roi.Services;
using micro_dashboard_roi.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ----- CONTROLLERS
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {

        //Substitui o 400 automático do [ApiController] pelo ErrorResponseDto
        options.InvalidModelStateResponseFactory = context =>
        {
            var erros = context.ModelState
              .Where(e => e.Value?.Errors.Count > 0)
              .ToDictionary(
                  kvp => kvp.Key,
                  kvp => kvp.Value!.Errors
                      .Select(e => e.ErrorMessage)
                      .ToArray()
              );

            var response = new ErrorResponseDto
            {
                Status = 400,
                Title = "Dados inválidos. Verifique os campos e tente novamente.",
                Errors = erros
            };
            return new BadRequestObjectResult(response);
        };
    });

// ----- EXCPETION HANDLER GLOBAL
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// ----- SWAGGER
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ----- BANCO DE DADOS
var sqlServerConnection = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(sqlServerConnection));

// ----- DI
builder.Services.AddScoped<ICampaignService, CampaignService>();

// ----- CORS
//Dev: libera apenas a origem do Vite
// Prod: lê a URL do appsettings.json
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy
                .WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            var allowedOrigin = builder.Configuration["Cors:AllowedOrigin"]
                ?? throw new InvalidOperationException(
                    "Cors:AllowedOrigin não configurado. " +
                    "Adicione a chave em appsettings.json.");

            policy
                .WithOrigins(allowedOrigin)
                .AllowAnyHeader()
                .WithMethods("GET", "POST", "PUT", "DELETE");
        }
    });
});

var app = builder.Build();

// Cria banco e tabelas automaticamente quando inicia
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();

        context.Database.EnsureCreated();
        Console.WriteLine("Banco de dados verificado/criado com sucesso!");
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Erro ao criar o banco de dados.");
    }
}

// ----- PIPELINE
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("FrontendPolicy");

app.UseAuthorization();
app.MapControllers();

app.Run();