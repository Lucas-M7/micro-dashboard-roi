using System.ComponentModel.DataAnnotations;

namespace micro_dashboard_roi.DTOs;

public class CreateDailyLogDto
{
    public int Id { get; init; }

    [Required(ErrorMessage = "A data do registro é obrigatória.")]
    public DateTime Date { get; init; }

    [Required(ErrorMessage = "O valor de gasto é obrigatório.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "O gasto deve ser maior que zero.")]
    public decimal Spend { get; set; }

    [Required(ErrorMessage = "O valor de faturamento é obrigatório.")]
    [Range(0, double.MaxValue, ErrorMessage = "O faturamento não pode ser negativo.")]
    public decimal Revenue { get; set; }
}