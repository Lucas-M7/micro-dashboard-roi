using micro_dashboard_roi.Models;
using micro_dashboard_roi.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace micro_dashboard_roi.Controllers;

[ApiController]
[Route("api/campaigns")]
public class CampaignsController : ControllerBase
{
    private readonly ICampaignService _campaignService;

    public CampaignsController(ICampaignService campaignService)
    {
        _campaignService = campaignService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateCampaign([FromBody] Campaign newCampaign)
    {
        await _campaignService.CreateCampaign(newCampaign);

        return CreatedAtAction(nameof(GetCampaignById), new { id = newCampaign.Id }, newCampaign);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCampaignById(int id)
    {
        var campaign = await _campaignService.GetCampaignById(id);

        if (campaign == null)
        {
            return NotFound();
        }

        return Ok(campaign);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllCampaigns()
    {
        var campaigns = await _campaignService.GetAllCampaigns();

        return Ok(campaigns);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCampaignById(int id)
    {
        await _campaignService.DeleteCampaignById(id);

        return NoContent();
    }

    [HttpPost("{id}/logs")]
    public async Task<IActionResult> AddLogToCampaign(int id, [FromBody] DailyLog newLog)
    {
        var campaign = await _campaignService.AddLogToCampaign(id, newLog);

        if (campaign is null)
        {
            return NotFound();
        }

        return Ok(campaign);
    }

    [HttpGet("{id}/logs")]
    public async Task<IActionResult> GetAllLogsOneCampaign(int id)
    {
        var campaign = await _campaignService.GetLogsByCampaign(id);

        if (campaign == null)
        {
            return NotFound();
        }

        return Ok(campaign);
    }

    [HttpGet("{id}/stats")]
    public async Task<IActionResult> GetOneCampaignStats(int id)
    {
        var campaign = await _campaignService.GetCampaignStats(id);

        if (campaign is null)
        {
            return NotFound();
        }

        return Ok(campaign);
    }
}