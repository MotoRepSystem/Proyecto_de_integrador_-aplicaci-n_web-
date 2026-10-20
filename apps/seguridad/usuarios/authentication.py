
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class MotoRepTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        data["grupos"] = list(
            self.user.groups.values_list("name", flat=True)
        )

        return data


class MotoRepTokenObtainPairView(TokenObtainPairView):
    serializer_class = MotoRepTokenObtainPairSerializer
