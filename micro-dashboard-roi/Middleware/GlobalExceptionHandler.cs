using micro_dashboard_roi.DTOs;
using Microsoft.AspNetCore.Diagnostics;

namespace micro_dashboard_roi.Middleware;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IHostEnvironment env)
    {
        _logger = logger;
        _env = env;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, 
        Exception exception, 
        CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Exceção não tratada: {Message}", exception.Message);

        var statusCode = exception switch
        {
            ArgumentException => StatusCodes.Status400BadRequest,
            InvalidOperationException   => StatusCodes.Status422UnprocessableEntity,
            KeyNotFoundException        => StatusCodes.Status404NotFound,
            UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
            _                           => StatusCodes.Status500InternalServerError
        };

        var response = new ErrorResponseDto
        {
            Status = statusCode,
            Title = ObterTitulo(statusCode),
            Detail = _env.IsDevelopment() ? exception.Message: null
        };

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/json";

        await httpContext.Response.WriteAsJsonAsync(response, cancellationToken);
        return true;
    }

    private static string ObterTitulo(int statusCode) => statusCode switch
    {
        400 => "Requisição inválida.",
        401 => "Não autorizado.",
        404 => "Recurso não encontrado.",
        422 => "Operação inválida.",
        _   => "Ocorreu um erro interno. Tente novamente mais tarde."
    };
}