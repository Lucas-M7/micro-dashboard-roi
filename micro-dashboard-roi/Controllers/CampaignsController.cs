using micro_dashboard_roi.DTOs;
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
        if (!ModelState.IsValid) return BadRequest(ModelState);

        await _campaignService.CreateCampaign(newCampaign);
        return CreatedAtAction(nameof(GetCampaignById), new { id = newCampaign.Id }, newCampaign);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCampaign(int id, [FromBody] UpdateCampaignDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var updated = await _campaignService.UpdateCampaign(id, dto);
        if (updated == null) return NotFound(new { message = "Campanha não encontrada" });

        return Ok(updated);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCampaignById(int id)
    {
        var campaign = await _campaignService.GetCampaignById(id);
        if (campaign == null) return NotFound(new { message = "Não foi possível encontrar a campanha com este ID." });

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
        var deleted = await _campaignService.DeleteCampaignById(id);
        if (!deleted) return NotFound(new { message = "Não foi possível deletar. Campanha não encontrada." });

        return NoContent();
    }

    [HttpPost("{id}/logs")]
    public async Task<IActionResult> AddLogToCampaign(int id, [FromBody] DailyLog newLog)
    {
        var result = await _campaignService.AddLogToCampaign(id, newLog);

        if (result == null) return NotFound(new { message = "Não foi possível adicionar um registro a campanha com este ID. Campanha não encontrada." });

        return Ok(result);
    }

    [HttpGet("{id}/logs")]
    public async Task<IActionResult> GetAllLogsOneCampaign(int id)
    {
        var logs = await _campaignService.GetLogsByCampaign(id);

        if (logs == null) return NotFound(new { message = "Campanha não encontrada." });

        return Ok(logs);
    }

    [HttpGet("{id}/stats")]
    public async Task<IActionResult> GetStats(int id)
    {
        var stats = await _campaignService.GetCampaignStats(id);

        if (stats == null) return NotFound(new { message = "Campanha não encontrada." });

        return Ok(stats);
    }
}