namespace micro_dashboard_roi.Models;

public class DailyLog
{
    public int Id { get; init; }
    public DateTime Date { get; init; }
    public decimal Spend { get; set; }
    public decimal Revenue { get; set; }
    public Campaign Campaign { get; init; } = default!;
    public int CampaignId { get; init; }
}