import time


AUTO_MODEL_ID = 'auto'
AUTO_MODEL_NAME = 'Auto'


def is_auto_model(model_id: object) -> bool:
    return isinstance(model_id, str) and model_id.strip().lower() == AUTO_MODEL_ID


def build_auto_model(url_idx: int = 0) -> dict:
    return {
        'id': AUTO_MODEL_ID,
        'name': AUTO_MODEL_NAME,
        'object': 'model',
        'created': int(time.time()),
        'owned_by': 'openai',
        'connection_type': 'external',
        'urlIdx': url_idx,
        'info': {
            'meta': {
                'description': 'GPTHub automatically routes the prompt to the right task and model.',
                'tags': [{'name': 'gpthub'}],
                'gpthub_modalities': ['text', 'vision', 'audio', 'image_generation'],
                'gpthub_primary_modality': 'text',
                'capabilities': {
                    'vision': True,
                    'audio': True,
                    'speech_to_text': True,
                    'transcription': True,
                    'file_upload': True,
                    'web_search': True,
                    'image_generation': True,
                    'code_interpreter': False,
                    'chat': True,
                },
            },
        },
        'tags': [{'name': 'gpthub'}],
    }
