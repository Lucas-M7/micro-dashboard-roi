using micro_dashboard_roi.Data;
using micro_dashboard_roi.DTOs;
using micro_dashboard_roi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;

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

        var logdDto = new DailyLogDTO
        {
            Id = newLog.Id,
            Date = newLog.Date,
            Spend = newLog.Spend,
            Revenue = newLog.Revenue,
            CampaignId = newLog.CampaignId
        };

        return Ok(logdDto);
    }
}