using System.Text.Json.Serialization;

namespace micro_dashboard_roi.Models;

public class DailyLog
{
    public int Id { get; init; }
    public DateTime Date { get; init; }
    public decimal Spend { get; set; }
    public decimal Revenue { get; set; }

    [JsonIgnore]
    public Campaign? Campaign { get; set; }
    public int CampaignId { get; set; }
}