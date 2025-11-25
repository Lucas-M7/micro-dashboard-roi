using micro_dashboard_roi.Models;

namespace micro_dashboard_roi.DTOs;

public class CampaignDto
{
    public int Id { get; init; }
    public string Name { get; set; } = string.Empty;
    public string Product { get; set; } = string.Empty;

    public ICollection<DailyLog> Logs { get; set; } = new List<DailyLog>();
}