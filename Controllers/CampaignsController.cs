using micro_dashboard_roi.Data;
using micro_dashboard_roi.DTOs;
using micro_dashboard_roi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace micro_dashboard_roi.Controllers;

[ApiController]
[Route("api/campaigns")]
public class CampaignsController : ControllerBase
{
    private readonly AppDbContext _context;

    public CampaignsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CreateCampaign([FromBody] Campaign newCampaign)
    {
        _context.Campaigns.Add(newCampaign);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCampaignById), new { id = newCampaign.Id }, newCampaign);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCampaignById(int id)
    {
        var campaign = await _context.Campaigns
                                    .Include(c => c.Logs)
                                    .FirstOrDefaultAsync(c => c.Id == id);

        if (campaign == null)
        {
            return NotFound();
        }

        var campaignDto = new CampaignDto
        {
            Id = campaign.Id,
            Name = campaign.Name,
            Product = campaign.Product,
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

        return Ok(campaignDto);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllCampaigns()
    {
        var campaigns = await _context.Campaigns.ToListAsync();

        return Ok(campaigns);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCampaignById(int id)
    {
        var campaign = await _context.Campaigns.FindAsync(id);

        if (campaign == null)
        {
            return NotFound();
        }

        _context.Remove(campaign);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/logs")]
    public async Task<IActionResult> AddLogToCampaign(int id, [FromBody] DailyLog newLog)
    {
        var campaign = await _context.Campaigns.FindAsync(id);
        if (campaign is null)
        {
            return NotFound();
        }

        newLog.CampaignId = id;

        _context.DailyLogs.Add(newLog);
        await _context.SaveChangesAsync();

        var logdDto = new CreateDailyLogDTO
        {
            Id = newLog.Id,
            Date = newLog.Date,
            Spend = newLog.Spend,
            Revenue = newLog.Revenue
        };

        return Ok(logdDto);
    }

    [HttpGet("{id}/logs")]
    public async Task<IActionResult> GetAllLogsOneCampaign(int id)
    {
        var campaignExists = await _context.Campaigns.AnyAsync(c => c.Id == id);
        if (!campaignExists)
        {
            return NotFound();
        }

        var logsFromDb = await _context.DailyLogs
                                    .Where(l => l.CampaignId == id)
                                    .ToListAsync();

        var logsDto = logsFromDb.Select(log => new DailyLogDTO
        {
            Id = log.Id,
            Date = log.Date,
            Spend = log.Spend,
            Revenue = log.Revenue,
            CampaignId = log.CampaignId
        }).ToList();

        return Ok(logsDto);
    }

    [HttpGet("{id}/stats")]
    public async Task<IActionResult> GetOneCampaignStats(int id)
    {
        var campaign = await _context.Campaigns
                                        .Include(c => c.Logs)
                                        .FirstOrDefaultAsync(c => c.Id == id);
        if (campaign ==  null)
        {
            return NotFound();
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

        return Ok(statsDto);
    }
}