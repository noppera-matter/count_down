package com.example.countdownhiit

import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            CountDownHIITTheme {
                CountDownApp()
            }
        }
    }
}

data class TimerUiState(
    val remainingSeconds: Int = 120,
    val isRunning: Boolean = false,
    val isBlinking: Boolean = false
)

class TimerViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(TimerUiState())
    val uiState: StateFlow<TimerUiState> = _uiState

    private var timerJob: Job? = null
    private var alarmJob: Job? = null

    fun start() {
        if (_uiState.value.isRunning) return
        _uiState.update { it.copy(isRunning = true) }
        startTimerLoop()
    }

    fun stop() {
        timerJob?.cancel()
        alarmJob?.cancel()
        timerJob = null
        alarmJob = null
        _uiState.value = TimerUiState()
    }

    private fun startTimerLoop() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (isActive) {
                while (isActive && _uiState.value.remainingSeconds > 0) {
                    delay(1000)
                    _uiState.update { state ->
                        state.copy(remainingSeconds = state.remainingSeconds - 1)
                    }
                }
                if (!isActive) return@launch
                runAlarmSequence()
                _uiState.update { it.copy(remainingSeconds = 120, isRunning = true) }
            }
        }
    }

    private suspend fun runAlarmSequence() {
        _uiState.update { it.copy(isBlinking = true) }
        alarmJob?.cancel()
        alarmJob = viewModelScope.launch {
            val generator = ToneGenerator(AudioManager.STREAM_ALARM, 100)
            try {
                val start = System.currentTimeMillis()
                while (isActive && System.currentTimeMillis() - start < 5000) {
                    generator.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 200)
                    delay(250)
                }
            } finally {
                generator.release()
            }
        }
        val blinkStart = System.currentTimeMillis()
        var blinkOn = true
        while (isActive && System.currentTimeMillis() - blinkStart < 5000) {
            _uiState.update { it.copy(isBlinking = blinkOn) }
            blinkOn = !blinkOn
            delay(250)
        }
        _uiState.update { it.copy(isBlinking = false) }
    }

    override fun onCleared() {
        timerJob?.cancel()
        alarmJob?.cancel()
        super.onCleared()
    }
}

@Composable
fun CountDownApp(viewModel: TimerViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsState()
    val background = if (state.isBlinking) Color(0xFF00C853) else MaterialTheme.colorScheme.background

    DisposableEffect(Unit) {
        onDispose { viewModel.stop() }
    }

    Surface(
        modifier = Modifier
            .fillMaxSize()
            .background(background),
        color = background
    ) {
        TimerContent(
            remainingSeconds = state.remainingSeconds,
            onStart = viewModel::start,
            onStop = viewModel::stop
        )
    }
}

@Composable
private fun TimerContent(
    remainingSeconds: Int,
    onStart: () -> Unit,
    onStop: () -> Unit
) {
    val minutes = remainingSeconds / 60
    val seconds = remainingSeconds % 60
    val formatted = "%d:%02d".format(minutes, seconds)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = formatted,
            fontSize = 64.sp,
            fontWeight = FontWeight.Bold
        )
        Button(
            onClick = onStart,
            modifier = Modifier.padding(top = 24.dp)
        ) {
            Text("Start")
        }
        Button(
            onClick = onStop,
            modifier = Modifier.padding(top = 12.dp)
        ) {
            Text("Stop")
        }
    }
}
