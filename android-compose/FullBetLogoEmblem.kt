package com.fullbet.app.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

// Koulè Ble Ofisyèl FULL BET
val AccentBlue = Color(0xFF1E88E5)
val CyanGlow = Color(0xFF00E5FF)

/**
 * Emblèm Logo Ofisyèl FULL BET
 *
 * Itilize imaj ki nan: `app/src/main/res/drawable/full_bet_logo.png`
 * Fòma: Sikilè ak kontou ble eklatant (CircleShape border).
 */
@Composable
fun FullBetLogoEmblem(
    modifier: Modifier = Modifier,
    size: Dp = 42.dp,
    borderColor: Color = AccentBlue,
    borderWidth: Dp = 1.5.dp,
    onClick: (() -> Unit)? = null
) {
    val clickableModifier = if (onClick != null) {
        Modifier.clickable { onClick() }
    } else {
        Modifier
    }

    Box(
        modifier = modifier
            .then(clickableModifier),
        contentAlignment = Alignment.Center
    ) {
        Image(
            painter = painterResource(id = com.fullbet.app.R.drawable.full_bet_logo),
            contentDescription = "Logo Full Bet",
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(size)
                .clip(CircleShape)
                .border(borderWidth, borderColor, CircleShape)
        )
    }
}

@Preview(showBackground = true, backgroundColor = 0xFF0D1322)
@Composable
fun FullBetLogoEmblemPreview() {
    FullBetLogoEmblem(size = 64.dp)
}
