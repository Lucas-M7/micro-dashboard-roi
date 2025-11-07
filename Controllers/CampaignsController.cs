using micro_dashboard_roi.Data;
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
        var campaign = await _context.Campaigns.FindAsync(id);

        if (campaign == null)
        {
            return NotFound();
        }

        return Ok(campaign);
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
}