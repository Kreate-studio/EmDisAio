const resolveAttack = (attacker, defender, ability) => {
    const attackMessage = [];
    let damage = 0;

    // Check for miss
    const hitChance = ability.accuracy || 95; // Default 95% accuracy
    if (Math.random() * 100 > hitChance) {
        attackMessage.push(`${attacker.name} used **${ability.name}**, but it missed!`);
        return { damage, newDefenderHealth: defender.stats.hp, message: attackMessage.join('\n') };
    }

    // Calculate base damage
    const baseDamage = ability.effect.damage || (attacker.stats.attack / 2);

    // Check for critical hit
    const criticalChance = 5; // 5% chance
    const isCritical = Math.random() * 100 < criticalChance;
    damage = isCritical ? baseDamage * 1.5 : baseDamage; // 50% extra damage

    // Apply defense
    damage = Math.round(damage - (defender.stats.defense * 0.5));
    if (damage < 1 && ability.effect.damage > 0) damage = 1;

    // Apply status effects
    if (ability.effect.status) {
        const status = ability.effect.status;
        if (!defender.statusEffects.some(e => e.type === status.type)) {
            defender.statusEffects.push({ ...status, turns: status.duration });
            attackMessage.push(`${defender.name} is now **${status.type}**!`);
        }
    }

    // Final damage calculation and message
    const newDefenderHealth = defender.stats.hp - damage;
    attackMessage.unshift(`${attacker.name} uses **${ability.name}** and deals **${damage}** damage to ${defender.name}.${isCritical ? ' It was a critical hit!' : ''}`);

    return { damage, newDefenderHealth, message: attackMessage.join('\n') };
};

module.exports = { resolveAttack };