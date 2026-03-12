using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;

namespace micro_dashboard_roi.Models;

public class Campaign
{
    public int Id { get; init; }

    [Required(ErrorMessage = "O nome da campanha é obrigatório.")]
    [MinLength(4, ErrorMessage = "O nome da campanha deve ter pelo menos 4 caracteres.")]
    [StringLength(100, ErrorMessage = "O nome da campanha deve ter no máximo 100 caracteres.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "O produto é obrigatório.")]
    [MinLength(2, ErrorMessage = "O nome do produto deve ter pelo menos 2 caracteres.")]
    [StringLength(100, ErrorMessage = "O nome do produto deve ter no máximo 100 caracteres.")]
    public string Product { get; set; } = string.Empty;
    
    public ICollection<DailyLog> Logs { get; set; } = new List<DailyLog>();
}