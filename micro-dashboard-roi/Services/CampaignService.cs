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
        var exists = await _context.Campaigns.AnyAsync(c => c.Id == campaignId);
        if (!exists) return null;

        dailyLog.CampaignId = campaignId;

        _context.DailyLogs.Add(dailyLog);
        await _context.SaveChangesAsync();

        return new CreateDailyLogDTO
        {
            Id = dailyLog.Id,
            Date = dailyLog.Date,
            Spend = dailyLog.Spend,
            Revenue = dailyLog.Revenue
        };
    }

    public async Task<Campaign> CreateCampaign(Campaign campaign)
    {
        _context.Campaigns.Add(campaign);
        await _context.SaveChangesAsync();
        return campaign;
    }

    public async Task<List<Campaign>> GetAllCampaigns()
    {
        return await _context.Campaigns.AsNoTracking().ToListAsync();
    }

    public async Task<CampaignDto?> GetCampaignById(int id)
    {
        var campaignDto = await _context.Campaigns
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new CampaignDto
            {
                Id = c.Id,
                Name = c.Name,
                Product = c.Product,
                // Mapeia a lista interna automaticamente
                Logs = c.Logs.Select(l => new DailyLog
                {
                    Id = l.Id,
                    Date = l.Date,
                    Spend = l.Spend,
                    Revenue = l.Revenue,
                    CampaignId = l.CampaignId
                }).ToList()
            })
            .FirstOrDefaultAsync();

        return campaignDto;
    }

    public async Task<CampaignStatsDto?> GetCampaignStats(int campaignId)
    {
        var campaign = await _context.Campaigns
            .Include(c => c.Logs)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == campaignId);

        if (campaign == null) return null;

        decimal totalSpend = campaign.Logs.Sum(l => l.Spend);
        decimal totalRevenue = campaign.Logs.Sum(l => l.Revenue);
        decimal totalProfit = totalRevenue - totalSpend;

        decimal roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
        decimal roi = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;

        return new CampaignStatsDto
        {
            CampaignId = campaign.Id,
            Name = campaign.Name,
            TotalSpend = totalSpend,
            TotalRevenue = totalRevenue,
            TotalProfit = totalProfit,
            ROAS = roas,
            ROI = roi,
        };
    }

    public async Task<List<DailyLogDTO>?> GetLogsByCampaign(int campaignId)
    {
        var exists = await _context.Campaigns.AnyAsync(c => c.Id == campaignId);
        if (!exists) return null;

        return await _context.DailyLogs
            .AsNoTracking()
            .Where(l => l.CampaignId == campaignId)
            .OrderByDescending(l => l.Date)
            .Select(log => new DailyLogDTO
            {
                Id = log.Id,
                Date = log.Date,
                Spend = log.Spend,
                Revenue = log.Revenue,
                CampaignId = log.CampaignId
            }).ToListAsync();

        // var logsFromDb = await _context.DailyLogs
        //                                 .Where(l => l.CampaignId == campaignId)
        //                                 .ToListAsync();

        // var logsDto = logsFromDb.Select(log => new DailyLogDTO
        // {
        //     Id = log.Id,
        //     Date = log.Date,
        //     Spend = log.Spend,
        //     Revenue = log.Revenue,
        //     CampaignId = log.CampaignId
        // }).ToList();

        // return logsDto;
    }

    public async Task<bool> DeleteCampaignById(int id)
    {
        var campaign = await _context.Campaigns.FindAsync(id);
        if (campaign == null) return false;

        _context.Campaigns.Remove(campaign);
        await _context.SaveChangesAsync();
        return true;
    }
}