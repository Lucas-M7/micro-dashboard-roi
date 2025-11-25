using System.ComponentModel.DataAnnotations;

namespace micro_dashboard_roi.Models;

public class Campaign
{
    public int Id { get; init; }

    [StringLength(100), MinLength(4, ErrorMessage = "O título da campanha deve ter pelo menos 4 caractéres.")]
    public string Name { get; set; } = string.Empty;

    [StringLength(100, ErrorMessage = "O nome do produto deve conter no máximo 100 caractéres.")]
    public string Product { get; set; } = string.Empty;
    public ICollection<DailyLog> Logs { get; set; } = new List<DailyLog>();
}