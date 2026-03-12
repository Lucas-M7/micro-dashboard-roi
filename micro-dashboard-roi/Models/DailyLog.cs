using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace micro_dashboard_roi.Models;

public class DailyLog
{
    public int Id { get; init; }

    [Required(ErrorMessage = "A data do registro é obrigatória.")]
    public DateTime Date { get; init; }

    [Required(ErrorMessage = "O valor de gasto é obrigatório.")]
    [Range(0.01, (double)decimal.MaxValue, ErrorMessage = "O gasto deve ser maior que zero.")]
    public decimal Spend { get; set; }

    [Required(ErrorMessage = "O valor de faturamento é obrigatório.")]
    [Range(0, (double)decimal.MaxValue, ErrorMessage = "O faturamento não pode ser negativo.")]
    public decimal Revenue { get; set; }

    [JsonIgnore]
    public Campaign? Campaign { get; set; }
    public int CampaignId { get; set; } // FK - preenchida pelo service, nunca pelo cliente
}