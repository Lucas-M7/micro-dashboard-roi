namespace micro_dashboard_roi.DTOs;

public class DailyLogDTO
{
    public int Id { get; init; }
    public DateTime Date { get; init; }
    public decimal Spend { get; set; }
    public decimal Revenue { get; set; }
    public int CampaignId { get; set; }
}