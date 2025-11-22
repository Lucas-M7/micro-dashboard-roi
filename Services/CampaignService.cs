using micro_dashboard_roi.Data;
using micro_dashboard_roi.DTOs;
using micro_dashboard_roi.Models;
using micro_dashboard_roi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace micro_dashboard_roi.Services;

public class CampaignService : ICampaignService
{
    private readonly AppDbContext _context;

    public CampaignService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<CreateDailyLogDTO?> AddLogToCampaign(int campaignId, DailyLog dailyLog)
    {
        var campaign = await _context.Campaigns.FindAsync(campaignId);

        if (campaign == null)
        {
            return null;
        }

        dailyLog.CampaignId = campaignId;

        _context.DailyLogs.Add(dailyLog);
        await _context.SaveChangesAsync();

        var logDto = new CreateDailyLogDTO
        {
            Id = dailyLog.Id,
            Date = dailyLog.Date,
            Spend = dailyLog.Spend,
            Revenue = dailyLog.Revenue
        };

        return logDto;
    }

    public async Task<Campaign> CreateCampaign(Campaign campaign)
    {
        _context.Campaigns.Add(campaign);
        await _context.SaveChangesAsync();

        return campaign;
    }

    public async Task<bool> DeleteCampaignById(int id)
    {
        var campaign = await _context.Campaigns.FindAsync(id);

        if (campaign == null)
        {
            return false;
        }

        _context.Remove(campaign);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<Campaign>> GetAllCampaigns()
    {
        var campaigns = await _context.Campaigns.ToListAsync();

        return campaigns;
    }

    public async Task<CampaignDto?> GetCampaignById(int id)
    {
        var campaign = await _context.Campaigns
                                    .Include(c => c.Logs)
                                    .FirstOrDefaultAsync(c => c.Id == id);

        if(campaign == null)
        {
            return null;
        }

        var campaignDto = new CampaignDto
        {
            Id = campaign.Id,
            Name = campaign.Name,
            Product = campaign.Product
        };

        foreach (var log in campaign.Logs)
        {
            campaignDto.Logs.Add(new DailyLog
            {
                Id = log.Id,
                Date = log.Date,
                Spend = log.Spend,
                Revenue = log.Revenue,
                CampaignId = log.CampaignId
            });
        }

        return campaignDto;
    }

    public async Task<CampaignStatsDto?> GetCampaignStats(int campaignId)
    {
        var campaign = await _context.Campaigns
                                    .Include(c => c.Logs)
                                    .FirstOrDefaultAsync(c => c.Id == campaignId);

        if (campaign == null)
        {
            return null;
        }

        decimal totalSpend = 0;
        decimal totalRevenue = 0;

        foreach (var log in campaign.Logs)
        {
            totalSpend += log.Spend;
            totalRevenue += log.Revenue;
        }

        decimal totalProfit = totalRevenue - totalSpend;

        decimal roas = 0;
        decimal roi = 0;

        if (totalSpend > 0)
        {
            roas = totalRevenue / totalSpend;
            roi = totalProfit / totalSpend;
        }

        var statsDto = new CampaignStatsDto
        {
            CampaignId = campaign.Id,
            Name = campaign.Name,
            TotalSpend = totalSpend,
            TotalRevenue = totalRevenue,
            TotalProfit = totalProfit,
            ROAS = roas,
            ROI = roi,
        };

        return statsDto;
    }

    public async Task<List<DailyLogDTO>> GetLogsByCampaign(int campaignId)
    {
        var campaign = await _context.Campaigns.AnyAsync(c => c.Id == campaignId);

        var logsFromDb = await _context.DailyLogs
                                        .Where(l => l.CampaignId == campaignId)
                                        .ToListAsync();

        var logsDto = logsFromDb.Select(log => new DailyLogDTO
        {
            Id = log.Id,
            Date = log.Date,
            Spend = log.Spend,
            Revenue = log.Revenue,
            CampaignId = log.CampaignId
        }).ToList();

        return logsDto;
    }
}