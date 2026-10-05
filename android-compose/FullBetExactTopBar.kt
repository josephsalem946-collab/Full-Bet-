package com.fullbet.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fullbet.app.ui.theme.FullBetSp

// =========================================================================
// KOULÈ TÈM OFISYÈL FULL BET & GAIN CASH
// =========================================================================
val DarkBackground = Color(0xFF0D1322)
val CardBackground = Color(0xFF151D30)
val AccentBlue = Color(0xFF1E88E5)
val TextWhite = Color(0xFFFFFFFF)
val GreenWin = Color(0xFF4CAF50)

/**
 * TopBar ofisyèl FULL BET ak gid tipografi sp:
 * - 20.sp a 24.sp : Gwo Tit (FULL BET)
 * - 14.sp : Tit pou kat / Solde montan
 * - 11.sp a 12.sp : Ti Detay / Subtitles
 * - 10.sp : Trè Ti Tèks / Captions
 * - maxLines = 1 ak TextOverflow.Ellipsis
 */
@Composable
fun FullBetExactTopBar(
    balance: String = "12 500 HTG",
    onLogoClick: () -> Unit = {},
    onWalletClick: () -> Unit = {},
    onProfileClick: () -> Unit = {},
    showTitleText: Boolean = false,
    modifier: Modifier = Modifier
) {
    var isMasked by remember { mutableStateOf(false) }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(DarkBackground)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // 1. Logo ofisyèl FULL BET
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            modifier = if (showTitleText) Modifier.weight(1f).clickable { onLogoClick() } else Modifier.clickable { onLogoClick() }
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(CardBackground)
                    .border(1.5.dp, AccentBlue, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = painterResource(id = com.fullbet.app.R.drawable.full_bet_logo),
                    contentDescription = "Logo Full Bet",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            }

            if (showTitleText) {
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(end = 4.dp)
                ) {
                    // Gwo Tit (20.sp a 24.sp)
                    Text(
                        text = "FULL BET",
                        color = TextWhite,
                        fontWeight = FontWeight.Bold,
                        fontSize = FullBetSp.HeaderAppTitle, // 20.sp
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    // Trè Ti Tèks / Captions (10.sp)
                    Text(
                        text = "PARIS • CASINO • BORLETTE",
                        color = AccentBlue,
                        fontWeight = FontWeight.Bold,
                        fontSize = FullBetSp.CaptionNote, // 10.sp
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }

        // 2. Solde konpòtman + Senbòl ki reprezante profil la
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Solde ak kantite lajan an (14.sp - Card Title / Data)
            Surface(
                onClick = {
                    isMasked = !isMasked
                    onWalletClick()
                },
                shape = RoundedCornerShape(16.dp),
                color = CardBackground,
                border = BorderStroke(1.dp, AccentBlue.copy(alpha = 0.8f))
            ) {
                Text(
                    text = if (isMasked) "•••• HTG" else balance,
                    color = GreenWin,
                    fontSize = FullBetSp.CardGameTitle, // 14.sp
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // Senbòl ki reprezante profil la (Body / Icon 16.sp)
            IconButton(
                onClick = onProfileClick,
                modifier = Modifier
                    .size(40.dp)
                    .background(CardBackground, shape = CircleShape)
                    .border(1.dp, AccentBlue.copy(alpha = 0.5f), CircleShape)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = "👤",
                        fontSize = FullBetSp.BodyRegular // 16.sp
                    )
                }
            }
        }
    }
}
