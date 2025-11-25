using micro_dashboard_roi.DTOs;
using micro_dashboard_roi.Models;

namespace micro_dashboard_roi.Services.Interfaces;

public interface ICampaignService
{
    Task<Campaign> CreateCampaign(Campaign campaign);
    Task<CampaignDto?> GetCampaignById(int id);
    Task<List<Campaign>> GetAllCampaigns();
    Task<bool> DeleteCampaignById(int id);
    Task<CreateDailyLogDTO?> AddLogToCampaign(int campaignId, DailyLog dailyLog);
    Task<List<DailyLogDTO>> GetLogsByCampaign(int campaignId);
    Task<CampaignStatsDto?> GetCampaignStats(int campaignId);
}