using System.ComponentModel.DataAnnotations;

namespace micro_dashboard_roi.DTOs;

public class UpdateCampaignDto
{
    [Required(ErrorMessage = "O nome da campanha é obrigatório.")]
    [MinLength(4, ErrorMessage = "O nome deve ter pelo menos 4 caracteres.")]
    [MaxLength(100, ErrorMessage = "O nome da campanha deve ter no máximo 100 caracteres.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "O produto é obrigatório.")]
    [MinLength(2, ErrorMessage = "O produto deve ter pelo menos 2 caracteres.")]
    [MaxLength(100, ErrorMessage = "O produto deve ter no máximo 100 caracteres.")]
    public string Product { get; set; } = string.Empty;
}