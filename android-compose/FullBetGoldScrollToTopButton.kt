package com.fullbet.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// =========================================================================
// KOULÈ LÒ OFISYÈL BOUTON SCROLL FULL BET (GOLD EDITION)
// =========================================================================
val GoldLight = Color(0xFFFFF3A8)
val GoldCore = Color(0xFFFFD700)
val GoldDark = Color(0xFFB8860B)
val GoldBorder = Color(0xFFFFE885)
val GoldIconDark = Color(0xFF1A1202)

/**
 * Bouton Scroll-to-Top an Lò pou Jetpack Compose
 * 
 * Karakteristik :
 * 1. Bèl ti koulè lò metalik (Degrade GoldLight -> GoldCore -> GoldDark).
 * 2. Disparèt otomatikman aprè 5 segond (5000ms) depi itilizatè a pa defile ankò.
 * 3. Reposyonnen imedyatman lè itilizatè a rekòmanse defile.
 * 4. Klike sou li mennen paj la anlè nèt ak yon animasyon dous.
 */
@Composable
fun FullBetGoldScrollToTopButton(
    scrollState: ScrollState,
    modifier: Modifier = Modifier,
    threshold: Int = 300,
    autoHideMs: Long = 5000L,
    onClick: (() -> Unit)? = null
) {
    val coroutineScope = rememberCoroutineScope()
    var isUserInteracting by remember { mutableStateOf(false) }

    val isPastThreshold by remember {
        derivedStateOf { scrollState.value > threshold }
    }

    // Revèy 5 segond pou fè bouton an disparèt si pa gen aksyon defilman
    LaunchedEffect(scrollState.value) {
        if (scrollState.value > threshold) {
            isUserInteracting = true
            delay(autoHideMs)
            isUserInteracting = false
        } else {
            isUserInteracting = false
        }
    }

    val isVisible = isPastThreshold && isUserInteracting

    AnimatedVisibility(
        visible = isVisible,
        enter = fadeIn(animationSpec = tween(300)) + scaleIn(initialScale = 0.7f),
        exit = fadeOut(animationSpec = tween(400)) + scaleOut(targetScale = 0.7f),
        modifier = modifier
    ) {
        Box(
            modifier = Modifier
                .size(52.dp)
                .shadow(
                    elevation = 12.dp,
                    shape = CircleShape,
                    spotColor = GoldCore,
                    ambientColor = GoldDark
                )
                .clip(CircleShape)
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(GoldLight, GoldCore, GoldDark)
                    )
                )
                .border(
                    BorderStroke(1.5.dp, GoldBorder),
                    shape = CircleShape
                )
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null
                ) {
                    if (onClick != null) {
                        onClick()
                    } else {
                        coroutineScope.launch {
                            scrollState.animateScrollTo(0)
                        }
                    }
                },
            contentAlignment = Alignment.Center
        ) {
            // Refleksyon limyè anlè bouton an
            Box(
                modifier = Modifier
                    .padding(top = 4.dp)
                    .width(28.dp)
                    .height(6.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.45f))
                    .align(Alignment.TopCenter)
            )

            // Flèch monte anlè a
            Icon(
                imageVector = Icons.Default.KeyboardArrowUp,
                contentDescription = "Monte anlè",
                tint = GoldIconDark,
                modifier = Modifier.size(30.dp)
            )
        }
    }
}
