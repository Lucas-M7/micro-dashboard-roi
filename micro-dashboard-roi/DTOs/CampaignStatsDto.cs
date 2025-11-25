namespace micro_dashboard_roi.DTOs;

public class CampaignStatsDto
{
    public int CampaignId { get; set; }
    public string Name { get; set; } = string.Empty;

    public decimal TotalSpend { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalProfit { get; set; }

    public decimal ROAS { get; set; }
    public decimal ROI { get; set; }
}