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
            return NotFound("Não foi possível encontrar a campanha com este ID.");
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
       var deleted =  await _campaignService.DeleteCampaignById(id);

       if(!deleted)
        {
            return NotFound("Não foi possível deletar. Campanha não encontrada.");
        }

        return NoContent();
    }

    [HttpPost("{id}/logs")]
    public async Task<IActionResult> AddLogToCampaign(int id, [FromBody] DailyLog newLog)
    {
        var campaign = await _campaignService.AddLogToCampaign(id, newLog);

        if (campaign is null)
        {
            return NotFound("NNão foi possível adicionar um registro a campanha com este ID. Campanha não encontrada.");
        }

        return Ok(campaign);
    }

    [HttpGet("{id}/logs")]
    public async Task<IActionResult> GetAllLogsOneCampaign(int id)
    {
        var campaign = await _campaignService.GetLogsByCampaign(id);

        if (campaign == null)
        {
            return NotFound("Campanha não encontrada.");
        }

        return Ok(campaign);
    }

    [HttpGet("{id}/stats")]
    public async Task<IActionResult> GetOneCampaignStats(int id)
    {
        var campaign = await _campaignService.GetCampaignStats(id);

        if (campaign is null)
        {
            return NotFound("Campanha não encontrada.");
        }

        return Ok(campaign);
    }
}