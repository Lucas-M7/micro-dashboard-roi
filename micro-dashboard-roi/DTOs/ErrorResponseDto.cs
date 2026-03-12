namespace micro_dashboard_roi.DTOs;

/// <summary>
/// Envelope padrão para todas as repostas de erro da API.
/// Seguindo o formato RFC 7807 (Problem Deaitail)
/// </summary>
public class ErrorResponseDto
{
    public int Status { get; set; }
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Detalhe técnico - populado apenas em ambiente de desenvolvimento.
    /// </summary>
    public string? Detail { get; set; }
    public Dictionary<string, string[]>? Errors { get; set; }
}